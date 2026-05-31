const ToDoModel=require('../models/ToDoModel')

module.exports.getToDo = async (req, res) => {
    try {
        const toDo = await ToDoModel.find().sort({ createdAt: -1 });
        res.send(toDo);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.saveToDo=async(req,res) =>{

    const { text, dueDate, status } =req.body;
    const nextStatus = status || "todo"

    ToDoModel
    .create({ text, dueDate: dueDate || null, status: nextStatus, completed: nextStatus === "completed" })
    .then((data) => {
        console.log("Added successfully");
        console.log(data);
        res.send(data)
    })
    

}
module.exports.updateToDo=async(req,res) =>{
    const{_id ,text, dueDate, completed, status}=req.body
    const updates = { text, dueDate: dueDate || null }
    if (status) {
        updates.status = status
        updates.completed = status === "completed"
    }

    if (typeof completed === "boolean") {
        updates.completed = completed
        updates.status = completed ? "completed" : updates.status || "todo"
    }

    ToDoModel
    .findByIdAndUpdate(_id, updates, { new: true, runValidators: true })
    .then((data) => res.send(data))
    .catch((err) => console.log(err))
}
module.exports.deleteToDo=async(req,res) =>{
    const{_id }=req.body;
    ToDoModel
    .findByIdAndDelete(_id)
    .then(() => {
        res.send("Deleted successfully...");})
    .catch((err) => console.log(err))
}

