const axios = require("axios");
const blueBird = require("bluebird");

const config = require("./config/values");

const BATCH_SIZE = 10;

embeddings = () => { };

embeddings.functions = {
    generateAndStoreEmbeddings: async (collection) => {
        try {
            // Fetch all documents without embeddings
            const documents = await collection.find({ embedding: { $exists: true } }).limit(10);
    
            if (documents.length === 0) {
                console.log(`✅ No new documents found without embeddings.`);
                return true;
            }
    
            console.log(`Found ${documents.length} documents to process.`);
    
            // Split documents into batches of BATCH_SIZE
            const documentChunks = [];
            for (let i = 0; i < documents.length; i += BATCH_SIZE) {
                documentChunks.push(documents.slice(i, i + BATCH_SIZE));
            }
    
            console.log(`Processing ${documentChunks.length} batches of ${BATCH_SIZE} documents each.`);
    
            for (const [index, batch] of documentChunks.entries()) {
                console.log(`Processing batch ${index + 1} of ${documentChunks.length}...`);
    
                const textData = batch.map((doc) => ({
                    _id: doc._id.toString(), // Convert ObjectId to string
                    text: Object.entries(doc["_doc"])
                        .filter(([key]) => key !== "_id" && key !== "__v" && key !== "embedding") // Ignore metadata
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")
                        .trim(),
                }));
    
                if (textData.length === 0) continue; // Skip empty batch
    
                // Log request data
                console.log(`Sending batch ${index + 1} to Python API`);
                console.log(`Request Payload (First 2 examples):`, textData.slice(0, 2));
    
                try {
                    // Send batch request to Python API
                    const response = await axios.post(
                        `${config.values.PYTHON_SERVER_URL}/generate-embedding/`, 
                        { texts: textData },
                        { timeout: 60000 }
                    );
    
                    const embeddings = response.data.embeddings; // Expecting an array of embeddings
    
                    // Log API response
                    console.log(`📥 Received response for batch ${index + 1}`);
                    console.log(`🔹 Received ${embeddings?.length || 0} embeddings for ${textData.length} texts.`);
    
                    if (!embeddings || embeddings.length !== textData.length) {
                        console.error(`Batch ${index + 1} failed: Mismatch in embeddings received.`);
                        continue;
                    }
    
                    // Prepare bulk update operations
                    const bulkUpdates = textData.map((item, idx) => ({
                        updateOne: {
                            filter: { "_id": item._id },
                            update: { $set: { embedding: embeddings[idx] } },
                            upsert: true
                        }
                    }));
    
                    // Store embeddings in MongoDB
                    await collection.bulkWrite(bulkUpdates);
                    console.log(`✅ Batch ${index + 1} stored successfully in MongoDB.`);
                } catch (error) {
                    console.error(`❌ Error processing batch ${index + 1}:`, error.response?.data || error.message);
                }
            }
    
            console.log(`🎉 All documents processed successfully!`);
            return true;
        } catch (error) {
            console.error(`Error in generateAndStoreEmbeddings:`, error);
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
            console.error(`❌ ERROR performing vector search:`, error);
            return [];
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