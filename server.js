const express = require('express');
const app = express();
const port = 4000;
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
dotenv.config();
const uri = process.env.URI;
const url = process.env.URL;
const session_uri = process.env.SESSION_URI


// mongo_db connection 
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// db_Schema
const todosSchema = new mongoose.Schema({
    username: String,
    password: String,
    todo: [String]
});
//plugin
todosSchema.plugin(passportLocalMongoose);
// Model
const Todo = mongoose.model('Todo', todosSchema);

// Middleware setup
app.use(cors({
    origin: url,
    methods: 'GET, POST, PUT, DELETE',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());

// Session and passport configuration
app.use(
    session({
        key:'userId',
        secret: 'your-secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
            secure: true,
          },
        store:  MongoStore.create({mongoUrl:process.env.SESSION_URI}),
    })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(Todo.authenticate()));

passport.serializeUser(Todo.serializeUser());

passport.deserializeUser(Todo.deserializeUser());

// Routes
app.post('/register', async (req, res) => {
    try {
        const user = await Todo.findOne({username:req.body.username});
        if(user){
            return res.send({msg:'User Already exsist'});
        }
        Todo.register({ username: req.body.username, active: false }, req.body.password, (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ msg: "Internal Server Error" });
            }
            else{
                passport.authenticate('local')(req , res , ()=>{
                    return res.send({ msg: 'User registered!' });
                })
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ msg: "Internal Server Error" });
    }
});


app.post('/login', passport.authenticate('local'), (req, res) => {  
    res.status(200).send({ msg: 'Successful login' });
});


app.get('/logout' , (req , res)=>{
    req.logOut((err)=>{
        if(err){
            console.error(err);
            res.status(400).send({msg:'cannot logout user'});
        }
        else{
            res.status(200).send({msg:'user loged out'});
        }
    });
    
} )

app.get('/', async (req, res) => {
    try{
        if(req.isAuthenticated()){
            const resp = await Todo.findOne({username:req.user.username});
            res.send(resp);
        }
        else{
            res.status(401).send({msg:"NOT AUTHORISED"});
        }   
    }
    catch(err){
        console.error(err);
    } 
});

app.post('/post', async (req, res) => {
    if(req.isAuthenticated()){
        const username = req.user.username;
        const newData = req.body.todo;
        try{
            const user = await Todo.findOne({ username});
            if(user){
                user.todo.push(newData);
                await user.save();
                res.send('saved successfully');
            }
            else{
                console.log('user with username: , '+ username + ' not found');
            }
            }
        catch(err){
            console.error(err);
        }    
    }
    else{
        res.status(401).send({msg:"you are Unauthorised!"});
    }
});

app.delete('/del/:id/:delId', async (req, res) => {
    const delId = req.params.delId; // Replace with the document's _id
    ; // Replace with the item you want to remove

    // Fetch the document from the database
    const doc = await Todo.findOne({ _id: delId });
    const itemToDelete = doc.todo[req.params.id];
    if (doc) {
    // Find the index of the item you want to remove
    const indexToRemove = doc.todo.indexOf(itemToDelete);

    if (indexToRemove !== -1) {
        // Remove the item from the array by index
        doc.todo.splice(indexToRemove, 1);

        // Save the modified document back to the database
        await doc.save();
        res.status(200).send({msg:"deleted successfully"});
    } else {
        res.status(400).send({msg:"deletion unsuccessfull"});
    }
    }

        
});

app.put('/put/:id/:uid', async (req, res) => {
    try{
        const id = req.params.id;
        const delId = req.params.uid;
        const data = req.body;
        const item = await Todo.findById({_id:delId});
        if(item){
            item.todo[id] = data.todo;
            item.save();
            res.send({msg:'updated!'});
        }
        else{
            res.send({msg:'cannot update item'});
        }

    }
    catch(err){
        console.error("An error occurred: " , err);
        res.send("something happened").status(400);
    }
});



app.listen(port, () => {
    console.log(`Running on port: ${port}`);
});
