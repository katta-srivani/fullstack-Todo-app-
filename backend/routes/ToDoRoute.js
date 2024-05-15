const {Router} = require("express");
const { getToDo, saveToDo, updateToDo, deleteToDo} = require("../controller/ToDoController");
const router = Router()
//const { getToDo, saveToDo } = require('../controller/ToDoController');
router.get('/get', getToDo)
router.post('/save', saveToDo)
router.post('/update', updateToDo)
router.post('/delete', deleteToDo)


module.exports=router;

