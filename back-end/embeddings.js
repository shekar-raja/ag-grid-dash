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

        const promises = [];
        
        for (const doc of documents) {
            // Combine all fields dynamically into a single text
            const combinedText = Object.entries(doc["_doc"])
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
                const embedding = response.data.embedding;

                // Update embedding in MongoDB
                promises.push(collection.updateOne({ _id: doc._id },
                    { $set: { embedding: embedding } }));
                // await collection.updateOne(
                //     { _id: doc._id },
                //     { $set: { embedding: embedding } }
                // );
            } catch (error) {
                console.error(`❌ ERROR processing ${doc._id}:`, error.response?.data || error.message);
            }
        }
        
        return Promise.all(promises).then((response) => {
            console.log(`✅ Stored embeddings in ${collection.modelName}`);
            return true;
        }).catch((error) => {
            return false;
        });
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