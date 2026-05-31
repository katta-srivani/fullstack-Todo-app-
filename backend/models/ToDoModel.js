const mongoose = require('mongoose')

const todoSchema= new mongoose.Schema({

    text: {
        type: String,
        required: true,
        trim: true
    },
    dueDate: {
        type: Date,
        default: null
    },
    completed: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["todo", "in-progress", "completed"],
        default: "todo"
    },

}, { timestamps: true })
module.exports=mongoose.model("ToDo",todoSchema)
