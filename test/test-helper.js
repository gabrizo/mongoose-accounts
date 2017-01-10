import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

process.env.NODE_ENV = 'test';

const config = {
db: {
  test: 'mongodb://localhost/mongoose-accounts',
},
connection: null,
};

function connect() {
return new Promise((resolve, reject) => {
  if (config.connection) {
    return resolve();
  }

  const mongoUri = 'mongodb://localhost/mongoose-accounts';

  mongoose.Promise = Promise;

  const options = {
    server: {
      auto_reconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
    },
  };

  mongoose.connect(mongoUri, options);

  config.connection = mongoose.connection;

  config.connection
    .once('open', resolve)
    .on('error', (e) => {
      if (e.message.code === 'ETIMEDOUT') {
        console.log(e);

        mongoose.connect(mongoUri, options);
      }

      console.log(e);
      reject(e);
    });
});
}

function clearDatabase() {
return new Promise(resolve => {
  for (const i in mongoose.connection.collections) {
    mongoose.connection.collections[i].remove(function() {});
  }

  resolve();
});
}

export async function setupTest() {
await connect();
await clearDatabase();
}
