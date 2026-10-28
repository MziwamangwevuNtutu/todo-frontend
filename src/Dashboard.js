import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import {
    Container, TextField, Button, List, ListItem, ListItemText,
    Checkbox, IconButton, Typography, Box, Paper, AppBar,
    Toolbar, CircularProgress, Alert, Snackbar, Dialog,
    DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Logout, Add, Delete, Edit, Save, Cancel, Visibility } from '@mui/icons-material';

const TODO_API_URL = `${process.env.REACT_APP_API_URL}/todolist/api/todos`;

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Snackbar for notifications
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // ✅ Controls whether todos are loaded AND displayed
    const [viewingTodos, setViewingTodos] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // ✅ Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [todoToDelete, setTodoToDelete] = useState(null);

    // Fetch todos only when "View Todos" is clicked
    const fetchTodos = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(TODO_API_URL, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            if (Array.isArray(data)) {
                setTodos(data);
            } else {
                setTodos([]);
            }
            setViewingTodos(true); // shows the list
        } catch (error) {
            console.error('Error fetching todos:', error);
            setError('Failed to load todos: ' + error.message);
            setTodos([]);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async () => {
        if (!newTodo.trim()) return;
        try {
            const response = await fetch(TODO_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: newTodo,
                    description: description,
                    completed: false
                })
            });
            
            if (response.ok) {
                setNewTodo('');
                setDescription('');
                // If already viewing, refresh the list
                if (viewingTodos) {
                    fetchTodos();
                }
                setSnackbar({
                    open: true,
                    message: 'Todo added successfully!',
                    severity: 'success'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: 'Failed to add todo.',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error adding todo:', error);
            setSnackbar({
                open: true,
                message: 'Error adding todo: ' + (error.message || 'Unknown error'),
                severity: 'error'
            });
        }
    };

    const toggleTodo = async (id, completed) => {
        const todoToUpdate = todos.find(todo => todo.id === id);
        if (!todoToUpdate) return;
        try {
            const response = await fetch(`${TODO_API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...todoToUpdate,
                    completed: !completed
                })
            });
            if (response.ok && viewingTodos) {
                fetchTodos();
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    };

    // ✅ Opens the custom dialog - simplified, no event needed
    const confirmDelete = (id) => {
        setTodoToDelete(id);
        setDeleteDialogOpen(true);
    };

    // ✅ Executes the actual deletion
    const handleDelete = async () => {
        if (!todoToDelete) return;
        try {
            const response = await fetch(`${TODO_API_URL}/${todoToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok && viewingTodos) {
                fetchTodos();
                setSnackbar({
                    open: true,
                    message: 'Todo deleted!',
                    severity: 'info'
                });
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        } finally {
            setDeleteDialogOpen(false);
            setTodoToDelete(null);
        }
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setTodoToDelete(null);
    };

    const startEditing = (todo) => {
        setEditingId(todo.id);
        setEditTitle(todo.title);
        setEditDescription(todo.description || '');
    };

    const saveEdit = async (id) => {
        const todoToUpdate = todos.find(t => t.id === id);
        if (!todoToUpdate) return;

        try {
            const response = await fetch(`${TODO_API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...todoToUpdate,
                    title: editTitle.trim() || todoToUpdate.title,
                    description: editDescription
                })
            });

            if (response.ok && viewingTodos) {
                setEditingId(null);
                fetchTodos();
                setSnackbar({
                    open: true,
                    message: 'Todo updated!',
                    severity: 'success'
                });
            }
        } catch (error) {
            console.error('Error saving todo:', error);
            setSnackbar({
                open: true,
                message: 'Error updating todo.',
                severity: 'error'
            });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Welcome, {user?.username}!
                    </Typography>
                    <IconButton color="inherit" onClick={logout}>
                        <Logout />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Add Todo Form */}
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Add New Todo
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Title"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Description (Optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={addTodo}
                                startIcon={<Add />}
                                disabled={!newTodo.trim()}
                            >
                                Add Todo
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={fetchTodos}
                                startIcon={<Visibility />}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'View Todos'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Only render todo list AFTER "View Todos" is clicked */}
                {viewingTodos && (
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">
                                My Todos ({todos.length})
                            </Typography>
                            {loading && <CircularProgress size={24} />}
                        </Box>

                        <List>
                            {todos.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        No todos found. Add one!
                                    </Typography>
                                </Box>
                            ) : (
                                todos.map((todo) => (
                                    <ListItem
                                        key={todo.id}
                                        secondaryAction={
                                            editingId === todo.id ? (
                                                <>
                                                    <IconButton edge="end" onClick={() => saveEdit(todo.id)} size="small">
                                                        <Save fontSize="small" />
                                                    </IconButton>
                                                    <IconButton edge="end" onClick={cancelEdit} size="small">
                                                        <Cancel fontSize="small" />
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <>
                                                    <IconButton edge="end" onClick={() => startEditing(todo)} size="small">
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    {/* ✅ Simplified - no event passing needed */}
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => confirmDelete(todo.id)}
                                                        size="small"
                                                        color="error"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )
                                        }
                                        sx={{ 
                                            alignItems: 'flex-start',
                                            py: 1
                                        }}
                                        dense
                                    >
                                        <Checkbox
                                            checked={todo.completed || false}
                                            onChange={() => toggleTodo(todo.id, todo.completed)}
                                            sx={{ pt: 0, pb: 0, mt: 0.5 }}
                                        />
                                        {editingId === todo.id ? (
                                            <Box sx={{ 
                                                flex: 1, 
                                                ml: 1, 
                                                display: 'flex', 
                                                gap: 1, 
                                                alignItems: 'center',
                                                flexWrap: 'wrap'
                                            }}>
                                                <TextField
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    size="small"
                                                    placeholder="Title"
                                                    sx={{ width: '45%' }}
                                                    inputProps={{ style: { padding: '4px 8px' } }}
                                                />
                                                <TextField
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    size="small"
                                                    placeholder="Description"
                                                    sx={{ width: '50%' }}
                                                    inputProps={{ style: { padding: '4px 8px' } }}
                                                />
                                            </Box>
                                        ) : (
                                            <ListItemText
                                                primary={todo.title}
                                                secondary={todo.description}
                                                sx={{
                                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                                    margin: 0
                                                }}
                                            />
                                        )}
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                )}

                {/* Snackbar for success/error messages */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* ✅ Custom Delete Confirmation Dialog with disableRestoreFocus */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleCloseDeleteDialog}
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                    disableRestoreFocus
                >
                    <DialogTitle id="delete-dialog-title">
                        Delete Todo?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-dialog-description">
                            Are you sure you want to delete this todo? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteDialog} color="inherit">
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} color="error" variant="contained" autoFocus>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

export default Dashboard;