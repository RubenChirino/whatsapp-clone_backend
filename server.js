import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

//App Config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1088149',
    key: '1176cabfbbd443871d9e',
    secret: '439fd0e4c632555d77f9',
    cluster: 'eu',
    encrypted: true
});

//middleware
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

//DB Config
const connection_url = 'mongodb+srv://admin:TZWhIs0eIQ3vqrZ9@cluster0.o1veh.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection('messagecontents');
    const changeStrean = msgCollection.watch();

    changeStrean.on('change', (change) => {
        console.log('A change ocurred', change);

        if(change.operationType === 'insert'){
           const messageDetails = change.fullDocument;
           pusher.trigger('messages', 'inserted', {
               name: messageDetails.name,
               message: messageDetails.message,
               timestamp: messageDetails.timestamp,
               received: messageDetails.received,
           }); 
        } else {
            console.log('Error triggering Pusher');
        }

    });

});

//API Routes
app.get('/', (req, res) => res.status(200).send('Hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(`new message created: \n ${data}`); 
        }
    });
});

//Listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`))