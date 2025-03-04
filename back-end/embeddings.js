const axios = require("axios");

const config = require("./config/values");

embeddings = () => { };

embeddings.functions = {
    generateAndStoreEmbeddings: async (collection) => {
        const documents = await collection.find({ embedding: { $exists: false } });
        // const documents = await collection.find().lean();

        if (documents.length === 0) {
            console.log(`No documents found without embeddings. Exiting.`);
            return;
        }
        
        for (const doc of documents) {
            // Combine all fields dynamically into a single text
            const combinedText = Object.entries(doc)
                .filter(([key, value]) => key !== "_id" && key !== "__v") // Ignore MongoDB metadata
                .map(([key, value]) => `${key}: ${value}`) // Format key-value pairs
                .join(" ")
                .trim();

            if (!combinedText) {
                console.log(`Skipping empty document: ${doc._id}`);
                continue;
            }

            try {
                // Send text to Python service for embedding
                const response = await axios.post(config.values.PYTHON_SERVER_URL + "/generate_embedding/", { text: combinedText });
                const embeddings = response.data.embedding;

                // Update embedding in MongoDB
                await collection.updateOne(
                    { _id: doc._id },
                    { $set: { embedding: embeddings } }
                );

            } catch (error) {
                console.error(`❌ ERROR processing ${doc._id}:`, error.response?.data || error.message);
            }
        }
        console.log(`✅ Stored embeddings in ${collection.modelName}`)
    },
    performVectorSearch: async (queryEmbedding, collection) => {
        try {
            const results = await collection.aggregate([
                {
                    $vectorSearch: {
                        index: "opportunity_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100, 
                        limit: 10, 
                        similarityMeasure: "cosine"
                    }
                }
            ]);
            return results;
        } catch (error) {
            console.error(`❌ ERROR performing vector search:`, error);
            return [];
        }
    }
}


module.exports = embeddings;