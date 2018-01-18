const express = require('express');
const authMiddleware = require('../middlewares/auth');

const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate(['user', 'tasks']);

    res.send({ projects });
  } catch (err) {
    res.status(400).send({ message: 'Error loading projects' });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    res.send({ project });
  } catch (err) {
    res.status(400).send({ message: 'Error creating new project' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, tasks } = req.body;

    const project = await Project.create({
      title,
      description,
      user: req.userId,
    });

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id });

      await projectTask.save();

      project.tasks.push(projectTask);
    }));

    await project.save();

    res.send({ project });
  } catch (err) {
    res.status(400).send({ message: 'Error creating new project' });
  }
});

router.put('/:projectId', async (req, res) => {
  try {
    const { title, description, tasks } = req.body;

    const project = await Project.findByIdAndUpdate(req.params.projectId, {
      title,
      description,
    }, { new: true });

    project.tasks = [];
    await Task.remove({ project: project._id });

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id });

      await projectTask.save();

      project.tasks.push(projectTask);
    }));

    await project.save();

    res.send({ project });
  } catch (err) {
    res.status(400).send({ message: 'Error updating project' });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    const project = await Project.findByIdAndRemove(req.params.projectId);

    res.send({ ok: true });
  } catch (err) {
    res.status(400).send({ message: 'Error deleting project' });
  }
});

module.exports = app => app.use('/projects', router);
