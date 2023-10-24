const express = require('express');
const app = express();
const port = 4000;
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
dotenv.config();
const uri = process.env.URI;


app.use(cors({
    origin: '*', // Replace '*' with the specific origins you want to allow, e.g., 'http://example.com'
    methods: 'GET, POST, PUT, DELETE'
}));

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect(uri , { useNewUrlParser: true, useUnifiedTopology: true });

const todosSchema = mongoose.Schema({
    todo: String
})

const Todo = mongoose.model('Todo' , todosSchema);


app.get('/' , async (req , res)=>{
    const resp = await Todo.find({});
    res.send(resp);
})
app.post('/post' , async (req , res)=>{
    try{
        const data = req.body;
        
        const newTodo = new Todo({
            todo: data.todo
        })
       await newTodo.save();
       res.send("posted successfully!!");
    }
    catch(err){
        console.error("An error occurred: " , err);
        res.status(400).send("something happened");

    }
})

app.delete('/del/:id' , async(req , res)=>{
        try{
            const id = req.params.id;
            await Todo.findByIdAndDelete(id);
            res.send("Deleted Successfully!")
        }
        catch(err){
            console.error("An error occurred: " , err);
            res.send("something happened").status(400);
        }
})

app.put('/put/:id',  async(req , res)=>{
    try{
        const id = req.params.id;
        const data = req.body;
        console.log(data);
        await Todo.findByIdAndUpdate(id , data , {new:true});
        res.send("updated successfully!!")

    }
    catch(err){
        console.error("An error occurred: " , err);
        res.send("something happened").status(400);
    }
})

app.listen(port, () => {
    console.log(`Running on port: ${port}`);
});
