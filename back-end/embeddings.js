const axios = require("axios");

const config = require("./config/values");
const DB = require("./db");
const { logger } = require("./config/logger");
const { resolve } = require("bluebird");

const BATCH_SIZE = 500;

embeddings = () => { };

embeddings.functions = {
    generateAndStoreEmbeddings: async (table) => {
        try {
            logger.info("Fetching records from PostgreSQL where embeddings do not exist...");
    
            // Count total records that need embeddings
            const countResult = await DB.query(`
                SELECT COUNT(*) FROM ${table} WHERE embedding IS NULL;
            `);
            let totalRecords = parseInt(countResult.rows[0].count, 10);
    
            if (totalRecords === 0) {
                logger.info(`No new records found without embeddings.`);
                return true;
            }
    
            logger.info(`Found ${totalRecords} records. Processing in batches of ${BATCH_SIZE}...`);
    
            while (totalRecords > 0) {
                // Fetch next batch of records **without OFFSET**
                const result = await DB.query(`
                    SELECT id, "leadId", "leadName", "phone", "email", "status", "priority", "lastInteraction", "followUp", "source", "comments"
                    FROM ${table}
                    WHERE embedding IS NULL
                    LIMIT $1;
                `, [BATCH_SIZE]);
    
                const documents = result.rows;
                if (documents.length === 0) break;
    
                logger.info(`Processing batch of ${documents.length} records...`);
    
                // Prepare text data for embedding generation
                // const textData = documents.map((doc) => ({
                //     id: doc.id, // Use PostgreSQL `id` as the identifier
                //     text: Object.entries(doc)
                //         .filter(([key]) => key !== "id" && key !== "embedding") // Ignore metadata
                //         .map(([key, value]) => `${key}: ${value}`)
                //         .join(", ")
                //         .trim(),
                // }));
                const textData = documents.map((doc) => ({
                    id: doc.id,
                    text: `Lead Name: ${doc.leadName}.Status: ${doc.status}.Priority: ${doc.priority}.Last Interaction: ${doc.lastInteraction}.Follow-Up Date: ${doc.followUp}.Source: ${doc.source}.Comments: ${doc.comments || "No comments."}.Email: ${doc.email}.Lead ID: ${doc.leadId}.Phone: ${doc.phone}`
                }));
    
                logger.info(`Sending ${textData.length} records for embedding generation...`);
    
                try {
                    // Send batch request to Python API
                    const response = await axios.post(
                        `${config.values.PYTHON_SERVER_URL}/generate-embedding/`, 
                        { texts: textData },
                        { timeout: 60000 }
                    );
    
                    const embeddings = response.data.embeddings; // Expecting an array of embeddings
                    logger.info(`Received ${embeddings?.length || 0} embeddings for ${textData.length} texts.`);
    
                    if (!embeddings || embeddings.length !== textData.length) {
                        logger.error(`Mismatch in embeddings received. Skipping this batch.`);
                        continue;
                    }
    
                    // Prepare bulk update query
                    const updateQuery = `
                        UPDATE ${table} 
                        SET embedding = CASE ${textData.map((_, i) => `WHEN id = $${i * 2 + 1} THEN $${i * 2 + 2}::jsonb`).join(" ")}
                        END 
                        WHERE id IN (${textData.map((_, i) => `$${i * 2 + 1}`).join(", ")});
                    `;
    
                    const values = textData.flatMap((item, idx) => [item.id, JSON.stringify(embeddings[idx])]);
    
                    // Execute batch update
                    await DB.query(updateQuery, values);
                    logger.info(`Successfully stored embeddings for ${textData.length} records.`);
    
                } catch (error) {
                    logger.error(`Error processing batch: ${error.response?.data || error.message}`);
                }
    
                // Recalculate remaining records
                const newCountResult = await DB.query(`
                    SELECT COUNT(*) FROM ${table} WHERE embedding IS NULL;
                `);
                totalRecords = parseInt(newCountResult.rows[0].count, 10);
            }
    
            logger.info(`All embeddings processed successfully!`);
            return true;
        } catch (error) {
            logger.error(`Error in generateAndStoreEmbeddings: ${error.message}`);
            return false;
        }
    },
    performVectorSearch: async (queryEmbedding, collection, index) => {
        try {
            const documents = await collection.aggregate([
                {
                    "$vectorSearch": {
                        "queryVector": queryEmbedding,
                        "path": "embedding",
                        "numCandidates": 100,
                        "limit": 50,
                        "index": index,
                    }
                },
                // {
                //     "$project": {
                //         "_id": 1,
                //         "ClientName": 1,
                //         "Description": 1,
                //         "score": { $meta: "vectorSearchScore" }
                //     }
                // }
              ]).exec();
            return documents.sort((a, b) => b.score - a.score);
        } catch (error) {
            // console.error(`❌ ERROR performing vector search:`, error);
            throw new Error("❌ ERROR performing vector search:")
            // return [];
        }
    },
    removeEmbeddings: (tables = []) => {
        return new Promise((resolve, reject) => {
            if (tables.length === 0) {
                logger.warn("⚠ No tables provided. Skipping embedding removal.");
                return false;
            }
            const promises = tables.map((table) => {
                return DB.query(`UPDATE ${table} SET embedding = NULL;`);
            });
    
            Promise.all(promises)
                .then((result) => {
                    logger.info("Embeddings removed successfully from all tables");
                    resolve("Embeddings removed successfully from all tables");
                })
                .catch((error) => {
                    logger.error(`❌ Postgres Error: ${error.message}`);
                    reject(new Error("Postgres Error Occurred"));
                });
        });
    },
    indexEmbeddings: async (batchSize = 1000, allEmbeddings) => {
        return new Promise((resolve, reject) => {
            if (!allEmbeddings || allEmbeddings.length === 0) {
                return reject("No embeddings to index");
            }
    
            let promises = [];
    
            allEmbeddings.forEach(({ table_name, embeddings }) => {
                for (let i = 0; i < embeddings.length; i += batchSize) {
                    const batch = embeddings.slice(i, i + batchSize);
                    const payload = {
                        table_name: table_name, // Specify which table these embeddings belong to
                        ids: batch.map(row => row.id),
                        embeddings: batch.map(row => row.embedding)
                    };
                    logger.info(`Sending batch ${i / batchSize + 1} of '${table_name}' to Python API`);
                    promises.push(
                        axios.post(config.values.PYTHON_SERVER_URL + "/index-embeddings", payload)
                    );
                }
            });
    
            return Promise.all(promises)
                .then((result) => {
                    return resolve(true);
                })
                .catch((error) => {
                    return reject("Python server error: " + error);
                });
        });
    }
}

module.exports = embeddings;