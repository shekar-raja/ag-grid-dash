const axios = require("axios");

const config = require("./config/values");
const DB = require("./db");
const { logger } = require("./config/logger");

const BATCH_SIZE = 500;

embeddings = () => { };

embeddings.functions = {
    generateAndStoreEmbeddings: async (table) => {
        try {
            logger.info("🚀 Fetching records from PostgreSQL where embeddings do not exist...");
    
            // Count total records that need embeddings
            const countResult = await DB.query(`
                SELECT COUNT(*) FROM opportunity WHERE embedding IS NULL;
            `);
            const totalRecords = parseInt(countResult.rows[0].count, 10);
    
            if (totalRecords === 0) {
                logger.info(`✅ No new records found without embeddings.`);
                return true;
            }
    
            logger.info(`📂 Found ${totalRecords} records. Processing in batches of ${BATCH_SIZE}...`);
    
            let processed = 0;
    
            while (processed < totalRecords) {
                // Fetch the next batch of records
                const result = await DB.query(`
                    SELECT * FROM opportunity
                    WHERE embedding IS NULL
                    LIMIT $1 OFFSET $2;
                `, [BATCH_SIZE, processed]);
    
                const documents = result.rows;
                if (documents.length === 0) break; // No more documents to process
    
                logger.info(`🔹 Processing batch ${processed / BATCH_SIZE + 1} (${documents.length} records)...`);
    
                // Prepare text data for embedding generation
                const textData = documents.map((doc) => ({
                    id: doc.id, // Use PostgreSQL `id` as the identifier
                    text: Object.entries(doc)
                        .filter(([key]) => key !== "id" && key !== "embedding") // Ignore metadata
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")
                        .trim(),
                }));
    
                logger.info(`📤 Sending ${textData.length} records for embedding generation...`);
    
                try {
                    // Send batch request to Python API
                    const response = await axios.post(
                        `${config.values.PYTHON_SERVER_URL}/generate-embedding/`, 
                        { texts: textData },
                        { timeout: 60000 }
                    );
    
                    const embeddings = response.data.embeddings; // Expecting an array of embeddings
    
                    logger.info(`📥 Received ${embeddings?.length || 0} embeddings for ${textData.length} texts.`);
    
                    if (!embeddings || embeddings.length !== textData.length) {
                        console.error("❌ Mismatch in embeddings received.");
                        return false;
                    }
    
                    // Prepare bulk update query
                    const updateQueries = [];
                    const values = [];
    
                    textData.forEach((item, idx) => {
                        updateQueries.push(`WHEN id = $${idx * 2 + 1} THEN $${idx * 2 + 2}::jsonb`);
                        values.push(item.id, JSON.stringify(embeddings[idx]));
                    });
    
                    // Construct final UPDATE query
                    const updateQuery = `
                        UPDATE opportunity 
                        SET embedding = CASE ${updateQueries.join(" ")} END
                        WHERE id IN (${textData.map((_, i) => `$${i * 2 + 1}`).join(", ")});
                    `;
    
                    // Execute batch update
                    await DB.query(updateQuery, values);
                    logger.info(`✅ Successfully stored embeddings for ${textData.length} records.`);
    
                } catch (error) {
                    console.error("❌ Error processing embeddings:", error.response?.data || error.message);
                }
    
                processed += documents.length;
            }
    
            logger.info(`🎉 All ${totalRecords} opportunities processed successfully!`);
            return true;
        } catch (error) {
            console.error(`❌ Error in generateAndStoreEmbeddings:`, error);
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
    removeEmbeddings: async (collection) => {
        const documents = await collection.find({ embedding: { $exists: true } });
        
        for (const doc of documents) {
            try {

                // Remove embedding in MongoDB
                await collection.updateOne(
                    { _id: doc._id },
                    { $unset: { embedding: 1 } }
                );
            } catch (error) {
                console.error(`❌ ERROR processing ${doc._id}:`, error.response?.data || error.message);
            }
        }
    }
}


module.exports = embeddings;