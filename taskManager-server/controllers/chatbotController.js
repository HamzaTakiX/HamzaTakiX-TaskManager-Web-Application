import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Task from '../models/Task.js';
import Notification from '../models/notification.model.js';
import * as conversationService from '../services/conversationService.js';

// Load environment variables
dotenv.config();

// Initialize Gemini with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

class chatbotController {
    constructor() {
        // Temporary storage for task drafts
        this.tempTasks = new Map();
        // Extended expiry time to 10 minutes
        this.TASK_EXPIRY_TIME = 600000; // 10 minutes in milliseconds
    }
    
    // Helper method to store temporary task
    _storeTempTask(userId, taskDetails) {
        console.log('\n=== Storing Temporary Task ===');
        console.log('User ID:', userId);
        console.log('Task Details:', JSON.stringify(taskDetails, null, 2));
        
        if (!taskDetails || !taskDetails.title) {
            console.error('❌ Invalid task details provided to _storeTempTask');
            throw new Error('Invalid task details: Missing title');
        }

        this.tempTasks.set(userId, {
            details: taskDetails,
            timestamp: Date.now()
        });
        console.log('✅ Task stored in temporary storage');
    }

    // Helper method to get temporary task
    _getTempTask(userId) {
        console.log('\n=== Getting Temporary Task ===');
        console.log('User ID:', userId);
        
        const tempTask = this.tempTasks.get(userId);
        console.log('Found temp task:', tempTask ? 'Yes' : 'No');
        
        if (!tempTask) {
            console.log('❌ No temporary task found');
            return null;
        }

        // Check expiry
        if (Date.now() - tempTask.timestamp > this.TASK_EXPIRY_TIME) {
            console.log('❌ Temporary task expired');
            this.tempTasks.delete(userId);
            return null;
        }

        console.log('✅ Valid temporary task found');
        console.log('Task Details:', JSON.stringify(tempTask.details, null, 2));
        return tempTask.details;
    }

    // Helper method to clear temporary task
    _clearTempTask(userId) {
        console.log('\n=== Clearing Temporary Task ===');
        console.log('User ID:', userId);
        
        if (this.tempTasks.has(userId)) {
            this.tempTasks.delete(userId);
            console.log('✅ Temporary task cleared');
        } else {
            console.log('⚠️ No temporary task found to clear');
        }
    }

    async analyzeIntent(message) {
        try {
            console.log('\n=== Analyzing Intent ===');
            console.log('Message:', message);
            
            // First check for direct update patterns
            if (message.toLowerCase().match(/^(title|status|priority|category|description|due date)\s*:\s*(.+)$/i)) {
                console.log('✅ Matched update pattern');
                return 'update task';
            }

            // Check for delete/remove task patterns
            const deletePatterns = [
                /^delete\s+task\s*:\s*(.+)/i,     // "delete task: taskname"
                /^delete\s*:\s*(.+)/i,            // "delete: taskname"
                /^delete\s+task\s+(.+)/i,         // "delete task taskname"
                /^remove\s+task\s*:\s*(.+)/i,     // "remove task: taskname"
                /^remove\s*:\s*(.+)/i,            // "remove: taskname"
                /^remove\s+task\s+(.+)/i,         // "remove task taskname"
                /^remove\s+(.+)/i,                // "remove taskname"
                /^delete\s+(.+)/i,                // "delete taskname"
                /^remove\((.+)\)/i,               // "remove(taskname)"
                /^delete\((.+)\)/i                // "delete(taskname)"
            ];

            console.log('Checking delete patterns...');
            for (const pattern of deletePatterns) {
                const match = message.match(pattern);
                if (match) {
                    console.log('✅ Matched delete pattern:', pattern);
                    console.log('Task to delete:', match[1].trim());
                    return 'delete task';
                }
            }

            // Check for create task patterns
            const createTaskPatterns = [
                /^create\s+task\s*:\s*(.+)/i,         // "create task: football"
                /^create\s+task\s+([^:,]+)/i,         // "create task football"
                /^add\s+task\s*:\s*(.+)/i,            // "add task: football"
                /^add\s+task\s+([^:,]+)/i,            // "add task football"
                /^create\s+a\s+task\s*:\s*(.+)/i,     // "create a task: football"
                /^create\s+a\s+task\s+([^:,]+)/i,     // "create a task football"
                /^make\s+a\s+task\s*:\s*(.+)/i,       // "make a task: football"
                /^make\s+a\s+task\s+([^:,]+)/i,       // "make a task football"
                /^make\s+task\s*:\s*(.+)/i,           // "make task: football"
                /^make\s+task\s+([^:,]+)/i            // "make task football"
            ];

            console.log('Checking create patterns...');
            for (const pattern of createTaskPatterns) {
                const match = message.match(pattern);
                if (match) {
                    console.log('✅ Matched create pattern:', pattern);
                    console.log('Task to create:', match[1].trim());
                    return 'create task';
                }
            }

            // Check for general conversation patterns
            const generalConversationPatterns = [
                /^(hi|hello|hey|greetings)/i,
                /^(how are you|how's it going)/i,
                /start.*conversation/i,
                /^[a-z]$/i  // Single letter messages
            ];

            // Check for general conversation patterns
            if (generalConversationPatterns.some(pattern => pattern.test(message.trim()))) {
                console.log('✅ Matched general conversation pattern');
                return 'general_conversation';
            }

            console.log('No specific pattern matched, proceeding with AI analysis');
            const prompt = `Analyze the following message and classify it into one of these categories: 'create task', 'update task', 'delete task', 'list tasks', 'view task', 'chat'. 
                          
                          If the message contains any of these patterns, classify as 'create task':
                          - "create a task"
                          - "make a task"
                          - "add a task"
                          - "new task"
                          - Any message that implies creating a task for something
                          
                          If the message contains any of these patterns, classify as 'update task':
                          - "update task"
                          - "change task"
                          - "modify task"
                          - "edit task"
                          - "update description"
                          - "change status"
                          - "set priority"
                          - Any message that implies modifying an existing task
                          
                          If the message contains any of these patterns, classify as 'list tasks':
                          - "show me all my tasks"
                          - "display my tasks"
                          - "give me my tasks"
                          - "list my tasks"
                          - "what are my tasks"
                          - "show tasks"
                          - Any message asking to see or display all tasks

                          Message: "${message}"
                          
                          Only respond with the category name.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const intent = response.text().trim().toLowerCase();

            // Validate that the response is one of the expected intents
            const validIntents = ['create task', 'update task', 'delete task', 'list tasks', 'view task', 'chat'];
            return validIntents.includes(intent) ? intent : 'chat';
        } catch (error) {
            console.error('Intent analysis error:', error.message);
            throw new Error('Failed to analyze intent');
        }
    }

    async extractTaskDetails(message) {
        try {
            console.log('\n=== Extracting Task Details ===');
            console.log('Original message:', message);

            // Extract title based on different patterns
            let title;
            const taskPatterns = [
                // With colon
                /^(?:create|add|make)(?:\s+a)?\s+task\s*:\s*(.+?)(?:\s*,|\s*$)/i,
                // Without colon - direct task name after "task"
                /^(?:create|add|make)(?:\s+a)?\s+task\s+([^:,]+)(?:\s*,|\s*$)/i,
                // Just the task name after create/add/make
                /^(?:create|add|make)\s+([^:,]+)(?:\s*,|\s*$)/i
            ];
            
            let matchFound = false;
            for (const pattern of taskPatterns) {
                const match = message.match(pattern);
                if (match) {
                    // Extract everything after "task" if present, otherwise use the whole match
                    const taskMatch = match[1].match(/^task\s+(.+)$/i);
                    title = taskMatch ? taskMatch[1].trim() : match[1].trim();
                    matchFound = true;
                    console.log('✅ Matched pattern:', pattern);
                    console.log('Extracted title:', title);
                    break;
                }
            }
            
            if (!matchFound) {
                // Fallback: remove common task creation words and use the rest as title
                title = message
                    .replace(/^(?:create|add|make)(?:\s+a)?\s+task(?:\s*:)?\s*/i, '')
                    .trim();
                console.log('⚠️ No pattern matched, using fallback. Title:', title);
            }
            
            // If still no clear title, ask Gemini AI to suggest one
            if (!title) {
                console.log('❌ No title found, asking AI for suggestion');
                const titlePrompt = `Generate a task title from this message: "${message}"`;
                const titleResult = await model.generateContent(titlePrompt);
                title = titleResult.response.text().trim();
                console.log('AI suggested title:', title);
            }

            console.log('\n=== Generating Task Details ===');
            // Now ask Gemini AI to generate all other task details
            const prompt = `Generate appropriate task details for a task titled "${title}". 
                          Respond in this format:
                          Category: [one of: Design, Development, Backend, Frontend, Testing, Other]
                          Description: [detailed description]
                          Priority: [low/medium/high]
                          Due Date: [suggest a reasonable date]`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            console.log('AI generated details:', text);
            
            const details = { title };
            
            // Extract generated details from Gemini's response
            const categoryMatch = text.match(/Category: (Design|Development|Backend|Frontend|Testing|Other)/i);
            if (categoryMatch) {
                details.category = categoryMatch[1];
                console.log('✅ Found category:', details.category);
            }

            const descMatch = text.match(/Description: (.*?)(\n|$)/);
            if (descMatch) {
                details.description = descMatch[1].trim();
                console.log('✅ Found description');
            }

            const priorityMatch = text.match(/Priority: (low|medium|high)/i);
            if (priorityMatch) {
                details.priority = priorityMatch[1].toLowerCase();
                console.log('✅ Found priority:', details.priority);
            }

            const dateMatch = text.match(/Due Date: (.*?)(\n|$)/);
            if (dateMatch) {
                const dateText = dateMatch[1].trim().toLowerCase();
                if (dateText.includes('next week')) {
                    details.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    console.log('✅ Set due date to next week');
                } else if (dateText.includes('tomorrow')) {
                    details.dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    console.log('✅ Set due date to tomorrow');
                } else if (dateText.includes('today')) {
                    details.dueDate = new Date();
                    console.log('✅ Set due date to today');
                } else {
                    details.dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Default to 3 days
                    console.log('⚠️ Using default due date (3 days from now)');
                }
            }

            // Set defaults for required fields
            console.log('\n=== Setting Default Values ===');
            details.status = 'To Do';
            details.startDate = new Date();
            details.category = details.category || 'Other';
            details.priority = details.priority || 'medium';
            details.description = details.description || 'Task created by AI assistant';
            details.dueDate = details.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

            console.log('Final task details:', details);
            return details;
        } catch (error) {
            console.error('❌ Task extraction error:', error);
            // Create a basic task with just the title
            const fallbackDetails = {
                title: message.replace(/create|task|make|add/gi, '').trim() || 'New Task',
                category: 'Other',
                description: 'Task created by AI assistant',
                priority: 'medium',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                status: 'To Do',
                startDate: new Date()
            };
            console.log('Using fallback details:', fallbackDetails);
            return fallbackDetails;
        }
    }

    async createTask(userId, taskDetails) {
        try {
            console.log('\n=== Creating New Task ===');
            console.log('User ID:', userId);
            console.log('Incoming Task Details:', JSON.stringify(taskDetails, null, 2));

            // Check if this is a validation response
            const tempTask = this._getTempTask(userId);
            
            if (tempTask) {
                const response = taskDetails.title?.toLowerCase() || '';
                console.log('User response:', response);
                
                // If user confirms with yes/ok/confirm
                if (response.match(/^(yes|ok|confirm|y)$/)) {
                    console.log('✅ User confirmed task creation');
                    console.log('Using temp task:', JSON.stringify(tempTask, null, 2));
                    
                    try {
                        const result = await this._finalizeTaskCreation(userId, tempTask);
                        this._clearTempTask(userId); // Only clear after successful creation
                        return result;
                    } catch (error) {
                        console.error('❌ Error in task finalization:', error);
                        // If task expired during finalization, inform the user
                        if (error.message.includes('expired')) {
                            return 'Your task confirmation has expired. Please create the task again.';
                        }
                        throw error;
                    }
                } 
                // If user rejects with no/cancel/reject
                else if (response.match(/^(no|cancel|reject|n)$/)) {
                    console.log('❌ User rejected task creation');
                    
                    if (tempTask.isDuplicate) {
                        // Keep the task details but mark it as waiting for new title
                        tempTask.waitingForNewTitle = true;
                        this._storeTempTask(userId, tempTask);
                        return "Please provide a new title for your task. You can write it as:\n- Just the title (e.g., 'hamza')\n- 'title: hamza'\n- 'my title is hamza'";
                    } else {
                        this._clearTempTask(userId);
                        return "Task creation cancelled. Let me know if you'd like to create a different task!";
                    }
                }
                // If we're waiting for a new title, process the input
                else if (tempTask.waitingForNewTitle) {
                    console.log('Processing new title input');
                    
                    // Extract title from various formats
                    let newTitle = '';
                    const titlePatterns = [
                        /^title\s*:\s*(.+)$/i,           // title: hamza
                        /^title\s+is\s+(.+)$/i,          // title is hamza
                        /^my\s+title\s+is\s+(.+)$/i,     // my title is hamza
                        /^new\s+title\s*:\s*(.+)$/i,     // new title: hamza
                        /^(.+)$/                         // hamza (fallback - just use the whole input)
                    ];

                    for (const pattern of titlePatterns) {
                        const match = response.match(pattern);
                        if (match) {
                            newTitle = match[1].trim();
                            break;
                        }
                    }

                    if (!newTitle) {
                        return "I couldn't understand the title. Please provide it again.";
                    }

                    // Check if new title also exists
                    const existingTask = await Task.findOne({
                        title: { $regex: new RegExp('^' + newTitle + '$', 'i') },
                        user: userId
                    });

                    if (existingTask) {
                        return `⚠️ The title "${newTitle}" also exists. Please try a different title.`;
                    }

                    // Update the task details with new title
                    tempTask.title = newTitle;
                    tempTask.waitingForNewTitle = false;
                    this._storeTempTask(userId, tempTask);

                    // Show confirmation with new title
                    return `📋 Please confirm the task details with the new title:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${tempTask.title}
Category: ${tempTask.category}
Priority: ${tempTask.priority}
Due Date: ${tempTask.dueDate.toLocaleDateString()}

📝 Description:
${tempTask.description}

Would you like to create this task? (Reply with yes/no)

Note: This confirmation will expire in 10 minutes.`;
                }
            }

            // Validate incoming task details
            if (!taskDetails || !taskDetails.title) {
                console.error('❌ Invalid task details provided');
                return 'Please provide valid task details including a title.';
            }

            // Check if task with same title exists
            const existingTask = await Task.findOne({
                title: { $regex: new RegExp('^' + taskDetails.title + '$', 'i') },
                user: userId
            });

            if (existingTask) {
                console.log('⚠️ Task with similar title exists:', existingTask.title);
                // Store task details temporarily with a flag indicating it's a duplicate
                taskDetails.isDuplicate = true;
                this._storeTempTask(userId, taskDetails);

                return `⚠️ A task with the title "${existingTask.title}" already exists.

Would you like to:
1. Create it anyway (reply with "yes")
2. Choose a different title (reply with "no")

Current task details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${taskDetails.title}
Category: ${taskDetails.category}
Priority: ${taskDetails.priority}
Due Date: ${taskDetails.dueDate.toLocaleDateString()}

📝 Description:
${taskDetails.description}`;
            }

            // Store task details temporarily and ask for confirmation
            try {
                this._storeTempTask(userId, taskDetails);
            } catch (error) {
                console.error('❌ Error storing task:', error);
                return 'There was an error preparing your task. Please try again.';
            }
            
            // Create confirmation message
            const confirmationMessage = `📋 Please confirm the task details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${taskDetails.title}
Category: ${taskDetails.category}
Priority: ${taskDetails.priority}
Due Date: ${taskDetails.dueDate.toLocaleDateString()}

📝 Description:
${taskDetails.description}

Would you like to create this task? (Reply with yes/no)

Note: This confirmation will expire in 10 minutes.`;

            console.log('Asking for confirmation');
            return confirmationMessage;

        } catch (error) {
            console.error('❌ Task creation error:', error);
            console.error('Error stack:', error.stack);
            this._clearTempTask(userId);
            return 'An error occurred while creating the task. Please try again.';
        }
    }

    // Helper method to finalize task creation
    async _finalizeTaskCreation(userId, taskDetails) {
        console.log('\n=== Finalizing Task Creation ===');
        console.log('User ID:', userId);
        console.log('Task Details:', JSON.stringify(taskDetails, null, 2));

        // Validate input
        if (!userId || !taskDetails) {
            console.error('❌ Missing required parameters');
            throw new Error('Missing required parameters for task creation');
        }

        try {
            // Validate required fields
            const requiredFields = ['title', 'description', 'category', 'priority', 'status'];
            const missingFields = requiredFields.filter(field => !taskDetails[field]);
            
            if (missingFields.length > 0) {
                console.error('❌ Missing required fields:', missingFields);
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Create task with the confirmed details
            const task = new Task({
                title: taskDetails.title,
                description: taskDetails.description,
                category: taskDetails.category,
                startDate: taskDetails.startDate || new Date(),
                dueDate: taskDetails.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                priority: taskDetails.priority,
                status: taskDetails.status,
                user: userId
            });

            console.log('💾 Attempting to save task...');
            const savedTask = await task.save();
            console.log('✅ Task saved successfully!');
            console.log('Saved Task:', JSON.stringify(savedTask, null, 2));

            // Create notification
            try {
                const notification = new Notification({
                    userId: userId,
                    title: 'New Task Created',
                    message: `AI Assistant created a new task: ${task.title}`,
                    type: 'task',
                    read: false
                });
                await notification.save();
                console.log('✅ Notification created');
            } catch (notifError) {
                console.error('⚠️ Notification creation failed:', notifError);
                // Don't fail the whole operation if notification fails
            }

            return `✅ Task created successfully!

📋 Task Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${savedTask.title}
Category: ${savedTask.category}
Priority: ${savedTask.priority}
Status: ${savedTask.status}
Due Date: ${savedTask.dueDate.toLocaleDateString()}
Start Date: ${savedTask.startDate.toLocaleDateString()}

📝 Description:
${savedTask.description}`;

        } catch (error) {
            console.error('❌ Error in _finalizeTaskCreation:', error);
            console.error('Error stack:', error.stack);
            
            // Check if it's a MongoDB validation error
            if (error.name === 'ValidationError') {
                const fields = Object.keys(error.errors).join(', ');
                throw new Error(`Invalid task data: ${fields}`);
            }
            
            throw new Error('Failed to save task: ' + error.message);
        }
    }

    async updateTask(userId, taskDetails) {
        try {
            console.log('\n=== Updating Task ===');
            console.log('User ID:', userId);
            console.log('Update Details:', JSON.stringify(taskDetails, null, 2));

            if (!taskDetails.title) {
                console.log('⚠️ No title provided for update');
                const prompt = `Which task do you want to update?`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            }   

            // Extract task title and field updates from the message
            const message = taskDetails.title;
            let taskTitle = '';
            let updateFields = {};

            // First check if this is an update command with task name
            const updateMatch = message.match(/^update\s+(?:task\s*:\s*)?['"]?([^'"]+)['"]?/i);
            if (updateMatch) {
                taskTitle = updateMatch[1].trim();
                
                // Look for field:value patterns
                const fieldPattern = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;
                let match;
                
                while ((match = fieldPattern.exec(message)) !== null) {
                    const [_, field, value] = match;
                    // Validate and process the field update
                    const processedValue = await this.processFieldUpdate(field.toLowerCase(), value);
                    if (processedValue !== null) {
                        updateFields[field.toLowerCase()] = processedValue;
                    }
                }
            } else {
                taskTitle = message;
            }

            // Find the task
            const task = await Task.findOne({
                title: new RegExp(taskTitle, 'i'),
                user: userId
            });

            if (!task) {
                console.log('❌ Task not found');
                const prompt = `Couldn't find a task with the title "${taskTitle}". Please check the task title and try again.`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            }

            // If we have field updates, apply them
            if (Object.keys(updateFields).length > 0) {
                const updatedTask = await Task.findByIdAndUpdate(
                    task._id,
                    { $set: updateFields },
                    { new: true }
                );

                if (updatedTask) {
                    console.log('✅ Task updated successfully');
                    console.log('Updated task details:', JSON.stringify(updatedTask, null, 2));
                    return `✅ Task "${updatedTask.title}" has been updated:
${Object.entries(updateFields)
    .map(([field, value]) => `• ${field}: ${value}`)
    .join('\n')}`;
                }
            }

            // If no specific updates, proceed with original update
            const updatedTask = await Task.findByIdAndUpdate(
                task._id,
                taskDetails,
                { new: true }
            );

            if (updatedTask) {
                console.log('✅ Task updated successfully');
                console.log('Updated task details:', JSON.stringify(updatedTask, null, 2));
                const prompt = `Updated task: "${updatedTask.title}"`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            }
        } catch (error) {
            console.error('❌ Task update error:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            const errorPrompt = `Failed to update task. Please make sure all fields are valid.`;
            const result = await model.generateContent(errorPrompt);
            return result.response.text();
        }
    }

    // Helper function to process field update
    async processFieldUpdate(field, value) {
        // Normalize field name
        field = field.toLowerCase();
        
        // Define valid values for each field
        const validFields = {
            title: value => value.trim(),
            status: value => {
                const validStatuses = ['to do', 'in progress', 'done'];
                value = value.toLowerCase();
                return validStatuses.includes(value) ? value : null;
            },
            priority: value => {
                const validPriorities = ['low', 'medium', 'high'];
                value = value.toLowerCase();
                return validPriorities.includes(value) ? value : null;
            },
            category: value => {
                const validCategories = ['design', 'development', 'backend', 'frontend', 'testing', 'other'];
                value = value.toLowerCase();
                return validCategories.includes(value) ? value : null;
            },
            description: value => value.trim(),
            duedate: value => {
                // Try to parse the date
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date;
            }
        };

        // Check if field is valid and process value
        if (validFields[field]) {
            const processedValue = validFields[field](value);
            if (processedValue !== null) {
                return processedValue;
            }
            console.log(`❌ Invalid value for field ${field}: ${value}`);
            return null;
        }

        console.log(`❌ Invalid field: ${field}`);
        return null;
    }

    async deleteTask(userId, taskDetails) {
        try {
            console.log('\n=== Deleting Task ===');
            console.log('User ID:', userId);
            console.log('Task Details:', JSON.stringify(taskDetails, null, 2));

            if (!taskDetails || !taskDetails.title) {
                return 'Please specify which task you want to delete.';
            }

            // Find the task - case insensitive search
            const task = await Task.findOne({
                title: { $regex: new RegExp('^' + taskDetails.title + '$', 'i') },
                user: userId
            });

            if (!task) {
                // Try to find similar tasks
                const similarTasks = await Task.find({
                    title: { $regex: new RegExp(taskDetails.title.split(' ')[0], 'i') },
                    user: userId
                }).limit(3);

                let suggestion = '';
                if (similarTasks.length > 0) {
                    suggestion = `\n\nDid you mean one of these tasks?\n${similarTasks.map(t => `• ${t.title}`).join('\n')}`;
                }

                return `❌ I couldn't find a task with the title "${taskDetails.title}".${suggestion}`;
            }

            // Delete the task
            await Task.deleteOne({ _id: task._id });

            // Create a notification
            try {
                const notification = new Notification({
                    userId: userId,
                    title: 'Task Deleted',
                    message: `Task "${task.title}" has been deleted`,
                    type: 'task',
                    read: false
                });
                await notification.save();
                console.log('✅ Deletion notification created');
            } catch (notifError) {
                console.error('⚠️ Notification creation failed:', notifError);
                // Don't fail the whole operation if notification fails
            }

            return `✅ Task "${task.title}" has been deleted successfully!`;

        } catch (error) {
            console.error('❌ Delete task error:', error);
            return 'An error occurred while deleting the task. Please try again.';
        }
    }

    async listTasks(userId) {
        try {
            console.log('\n=== Listing Tasks ===');
            console.log('User ID:', userId);
            
            // Check if there are any tasks in progress of being updated
            const inProgressTasks = await Task.find({ 
                user: userId,
                status: { $in: ['To Do', 'In Progress'] }
            });

            if (inProgressTasks.length === 0) {
                console.log('No tasks found');
                return {
                    success: true,
                    aiResponse: `📝 You don't have any tasks yet!

Would you like to create your first task? Just say something like:
• "Create a new task"
• "Add task: [your task title]"
• "Create task: [task title] with priority high"

I'll help you organize and track your tasks effectively! 🚀`
                };
            }

            // Sort tasks by status and then alphabetically by title
            const tasks = await Task.find({ user: userId })
                .sort({ status: 1, title: 1 });
            
            console.log('Found tasks:', tasks.length);

            // Group tasks by status
            const tasksByStatus = {
                'To Do': [],
                'In Progress': [],
                'Done': []
            };

            tasks.forEach(task => {
                if (tasksByStatus[task.status]) {
                    tasksByStatus[task.status].push(task);
                }
            });

            // Format tasks list grouped by status
            let tasksList = '';
            for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
                if (statusTasks.length > 0) {
                    tasksList += `\n${status} (${statusTasks.length}):\n`;
                    tasksList += statusTasks.map((task, index) => 
                        `${index + 1}. ${task.title} (${task.priority} priority)`
                    ).join('\n');
                    tasksList += '\n';
                }
            }

            const response = `📋 Your Tasks (${tasks.length} total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${tasksList}
Need to update a task? Just say "Update task: [task title]" 📝
Want to add another task? Say "Create new task" ✨`;

            console.log('Formatted response:', response);
            return {
                success: true,
                aiResponse: response
            };

        } catch (error) {
            console.error('❌ Task listing error:', error);
            return {
                success: false,
                error: error.message,
                aiResponse: 'Sorry, there was an error listing your tasks. Please try again.'
            };
        }
    }

    async viewTask(userId, taskDetails) {
        try {
            if (!taskDetails.title) {
                // Let Gemini AI handle the conversation
                const prompt = `Which task do you want to view?`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            }

            const task = await Task.findOne({
                title: taskDetails.title,
                user: userId
            });

            if (!task) {
                // Let Gemini AI handle the conversation
                const prompt = `Couldn't find that task.`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            }

            // Let Gemini AI generate the response
            const prompt = `Task: ${task.title}\nPriority: ${task.priority || 'not set'}\nStatus: ${task.status}\nDue: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'no due date'}`;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Task viewing error:', error);
            // Let Gemini handle error responses too
            const errorPrompt = `Failed to view task.`;
            const result = await model.generateContent(errorPrompt);
            return result.response.text();
        }
    }

    async getAIResponse(message, conversationHistory = []) {
        try {
            console.log('\n=== Getting AI Response ===');
            console.log('Input message:', message);
            console.log('History length:', conversationHistory.length);

            // Check for specific task creation greeting
            if (message.toLowerCase().trim() === 'hello i want to create new task') {
                console.log('✅ Matched specific task creation greeting');
                return `I'll help you create a new task! 🎯

To create a task effectively, please provide some details:
• What's the title or main objective of the task?
• When does it need to be completed?
• What priority level would you assign (high/medium/low)?
• Any specific category (Development/Design/Testing/etc)?

You can provide these details all at once like:
"Create task: Build login page, high priority, due next week"

Or just tell me the task title and I'll help you fill in the rest! What would you like to create?`;
            }

            // If this is a task creation request, ask for detailed information
            if (message.toLowerCase().includes('create') && message.toLowerCase().includes('task')) {
                const initialResponse = `Let's create your task! 📝

Please provide the following details:
• Task title or objective
• Due date (optional)
• Priority level (high/medium/low)
• Category (optional)

Example: "Create task: Update website, high priority, due tomorrow"`;

                // If the message already contains detailed information, proceed with task creation
                if (message.length > 30 || message.includes(':')) {
                    try {
                        const taskPrompt = `You are a task management assistant. Create a detailed task based on the user's request: "${message}"`;
                        const result = await model.generateContent(taskPrompt);
                        return result.response.text();
                    } catch (error) {
                        if (error.message?.includes('SAFETY')) {
                            throw new Error('Content flagged for safety concerns. Please rephrase your request appropriately.');
                        }
                        throw error;
                    }
                }
                return initialResponse;
            }

            try {
                const result = await model.generateContent(message);
                return result.response.text();
            } catch (error) {
                if (error.message?.includes('SAFETY')) {
                    throw new Error('Content flagged for safety concerns. Please rephrase your request appropriately.');
                }
                throw error;
            }
        } catch (error) {
            console.error('AI Response error:', error);
            throw error;
        }
    }

    async getGeneralConversationResponse(message) {
        try {
            // For general conversations, let Gemini respond naturally
            const prompt = `You are a friendly and helpful AI assistant. Respond naturally to this message: "${message}"`;
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('General conversation error:', error);
            return "I'm here to help! What would you like to talk about?";
        }
    }

    async processMessage(userId, message, conversationHistory = []) {
        try {
            console.log('\n=== Processing New Message ===');
            console.log('Message received:', message);
            console.log('User ID:', userId);
            console.log('Conversation history length:', conversationHistory.length);

            // First check if there's a pending task confirmation
            const tempTask = this._getTempTask(userId);
            if (tempTask) {
                const response = message.toLowerCase();
                
                // If waiting for new title, handle it before any AI processing
                if (tempTask.waitingForNewTitle) {
                    return {
                        success: true,
                        aiResponse: await this.createTask(userId, { title: message })
                    };
                }
                
                // Handle yes/no responses
                if (response.match(/^(yes|ok|confirm|y)$/)) {
                    return {
                        success: true,
                        aiResponse: await this.createTask(userId, { title: response })
                    };
                } else if (response.match(/^(no|cancel|reject|n)$/)) {
                    return {
                        success: true,
                        aiResponse: await this.createTask(userId, { title: response })
                    };
                }
            }

            // Check for delete/remove patterns before AI processing
            const deletePatterns = [
                /^delete\s+task\s*:\s*(.+)/i,     // "delete task: taskname"
                /^delete\s*:\s*(.+)/i,            // "delete: taskname"
                /^delete\s+task\s+(.+)/i,         // "delete task taskname"
                /^remove\s+task\s*:\s*(.+)/i,     // "remove task: taskname"
                /^remove\s*:\s*(.+)/i,            // "remove: taskname"
                /^remove\s+task\s+(.+)/i,         // "remove task taskname"
                /^remove\s+(.+)/i,                // "remove taskname"
                /^delete\s+(.+)/i,                // "delete taskname"
                /^remove\((.+)\)/i,               // "remove(taskname)"
                /^delete\((.+)\)/i                // "delete(taskname)"
            ];

            for (const pattern of deletePatterns) {
                const match = message.match(pattern);
                if (match) {
                    const taskTitle = match[1].trim();
                    console.log('Delete pattern matched. Task title:', taskTitle);
                    return {
                        success: true,
                        aiResponse: await this.deleteTask(userId, { title: taskTitle })
                    };
                }
            }

            // If no pending confirmation or not waiting for title, proceed with intent analysis
            const intent = await this.analyzeIntent(message);
            console.log('Detected intent:', intent);

            // For general conversations or chat intents, use Gemini's natural response
            if (intent === 'chat' || message.toLowerCase().includes('hello i want to start a general conversation')) {
                const response = await this.getGeneralConversationResponse(message);
                return {
                    success: true,
                    aiResponse: response
                };
            }

            // Handle initial update task request
            if (message.toLowerCase() === 'hello i want to update my tasks') {
                return {
                    success: true,
                    aiResponse: `I'll help you update your tasks! 🔄

To update a task, please let me know:
• Which task do you want to update? (the task title)
• What would you like to change?

You can update:
• Status (To Do, In Progress, Done)
• Priority (high/medium/low)
• Category
• Due Date
• Description

For example:
• "Update task: Frontend Design, change status to In Progress"
or
"Update task: Database Setup, set priority to high"

First, which task would you like to update?`
                };
            }

            // Handle task selection for update
            const updatePatterns = [
                /^update\s+task\s*:\s*(.+?)(?:\s*,|\s*$)/i,    // "Update task: management"
                /^update\s*:\s*(.+?)(?:\s*,|\s*$)/i,           // "Update: management"
                /^update\s+my\s+task\s+(.+?)(?:\s*,|\s*$)/i,   // "Update my task management"
                /^update\s+task\s+(.+?)(?:\s*,|\s*$)/i,        // "Update task management"
                /^update\s+this\s+(.+?)(?:\s*,|\s*$)/i,        // "Update this management"
                /^edit\s+(.+?)(?:\s*,|\s*$)/i,                 // "Edit management"
                /^update\s+(.+?)(?:\s*,|\s*$)/i                // "Update management"
            ];

            let taskTitle = null;
            for (const pattern of updatePatterns) {
                const match = message.match(pattern);
                if (match) {
                    taskTitle = match[1].trim();
                    // Remove any parentheses if present
                    taskTitle = taskTitle.replace(/[()]/g, '').trim();
                    break;
                }
            }

            if (taskTitle) {
                console.log('Looking for task:', taskTitle);

                // Find the task - make search more flexible
                const task = await Task.findOne({ 
                    title: new RegExp(taskTitle, 'i'), // Made the regex more flexible
                    user: userId 
                });

                if (!task) {
                    // Get similar tasks to suggest
                    const similarTasks = await Task.find({
                        title: { $regex: new RegExp(taskTitle.split(' ')[0], 'i') },
                        user: userId
                    }).limit(3);

                    let suggestion = '';
                    if (similarTasks.length > 0) {
                        suggestion = `\n\nDid you mean one of these tasks?\n${similarTasks.map(t => `• ${t.title}`).join('\n')}`;
                    }

                    return {
                        success: false,
                        error: 'Task not found',
                        aiResponse: `I couldn't find a task with the title "${taskTitle}".${suggestion}\n\nPlease check the title and try again.`
                    };
                }

                // Format the task details nicely
                const taskDetails = `📋 Current Task Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Category: ${task.category}
Due Date: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'Not set'}
Description: ${task.description}

What would you like to update? You can:

1. Update the status:
   "Set status to: [To Do/In Progress/Done]"

2. Change the priority:
   "Set priority to: [High/Medium/Low]"

3. Modify the category:
   "Set category to: [Development/Design/Testing/Other]"

4. Update the due date:
   "Set due date to: [date]"

5. Change the title:
   "Set title to: [new title]"

6. Update the description:
   "Set description to: [new description]"

You can also update multiple fields at once:
"Set status to In Progress, priority to High"

Just tell me what you'd like to change! 🔄`;

                return {
                    success: true,
                    aiResponse: taskDetails,
                    taskContext: task // Store task context for future updates
                };
            }

            // Handle field updates after task is selected
            const fieldUpdateMatch = message.match(/^set\s+(\w+)\s+to:?\s*(.+)$/i);
            if (fieldUpdateMatch) {
                // Process the field update...
                // This will be handled by the existing updateTask method
                return await this.updateTask(userId, { 
                    title: conversationHistory[conversationHistory.length - 1]?.taskContext?.title,
                    [fieldUpdateMatch[1].toLowerCase()]: fieldUpdateMatch[2].trim() 
                });
            }

            // Handle delete task intent
            if (message.toLowerCase().includes('delete') && message.toLowerCase().includes('task')) {
                console.log('\n=== Processing Delete Task Request ===');
                
                try {
                    // Check if there are any tasks in progress of being updated
                    const inProgressTasks = await Task.find({ 
                        user: userId,
                        status: { $in: ['To Do', 'In Progress'] }
                    });

                    if (inProgressTasks.length === 0) {
                        console.log('No tasks found');
                        return {
                            success: true,
                            aiResponse: `📝 You don't have any tasks yet!

Would you like to create your first task? Just say something like:
• "Create a new task"
• "Add task: [your task title]"
• "Create task: [task title] with priority high"

I'll help you organize and track your tasks effectively! 🚀`
                        };
                    }

                    // Get task from message or conversation history
                    const taskTitle = await this.extractTaskFromContext(message, conversationHistory);
                    console.log('Extracted task title:', taskTitle);
                    
                    if (!taskTitle) {
                        return {
                            success: true,
                            aiResponse: 'Which task would you like to delete? Please provide the task title.'
                        };
                    }

                    try {
                        // Find the task
                        const task = await Task.findOne({ 
                            title: { $regex: new RegExp(taskTitle, 'i') },
                            user: userId 
                        });

                        if (!task) {
                            return {
                                success: false,
                                error: 'Task not found',
                                aiResponse: `I couldn't find a task with the title "${taskTitle}". Please check the title and try again.`
                            };
                        }

                        // Delete the task
                        await Task.findByIdAndDelete(task._id);
                        console.log('Task deleted successfully:', task.title);

                        return {
                            success: true,
                            aiResponse: `✅ Successfully deleted task "${task.title}"`
                        };
                    } catch (error) {
                        console.error('Error deleting task:', error);
                        return {
                            success: false,
                            error: error.message,
                            aiResponse: 'Sorry, there was an error deleting the task. Please try again.'
                        };
                    }
                } catch (error) {
                    console.error('Error deleting task:', error);
                    return {
                        success: false,
                        error: error.message,
                        aiResponse: 'Sorry, there was an error deleting the task. Please try again.'
                    };
                }
            }

            // Check if this is a direct field update first (e.g., "title: New Task")
            const directUpdateMatch = message.toLowerCase().match(/^(title|status|priority|category|description|due date)\s*:\s*(.+)$/i);
            if (directUpdateMatch) {
                // Let Gemini AI handle the conversation
                const prompt = `You are a task management assistant. Please provide a helpful response for the user's request: "${message}"`;
                const result = await model.generateContent(prompt);
                return result.response.text();
            }

            // Check if this is a task creation request
            if (message.toLowerCase().includes('create') && message.toLowerCase().includes('task')) {
                // Check if this is just an initial request without details
                const isInitialRequest = message.toLowerCase().match(/^(hello|hi|hey)?.*(create|make|add).*(new)?.*task.*$/i) && 
                    !message.includes(':') && 
                    message.length < 50 && 
                    !message.includes('status') && 
                    !message.includes('priority') && 
                    !message.includes('due');

                if (isInitialRequest) {
                    console.log('Initial task creation request without details detected');
                    return {
                        success: true,
                        aiResponse: `I'll help you create a new task! 🎯

To create a task effectively, please provide some details:
• What's the title or main objective of the task?
• When does it need to be completed?
• What priority level would you assign (high/medium/low)?
• Any specific category (Development/Design/Testing/etc)?

You can provide these details all at once like:
"Create task: Build login page, high priority, due next week"

Or just tell me the task title and I'll help you fill in the rest! What would you like to create?`
                    };
                }

                // For messages with actual task details, proceed with task creation
                // Extract potential title from the initial message
                const initialTitleMatch = message.match(/(?:create|make|add)(?:\s+a)?\s+task:?\s*([^:\n]+?)(?:\s+Category:|\s*$)/i);
                console.log('Initial title match:', initialTitleMatch ? initialTitleMatch[1] : 'No title in initial message');

                // Extract task details from AI response
                const taskContent = await this.getAIResponse(message, conversationHistory);
                console.log('Processing task content for details');
                
                // Extract all task components using regex
                const taskMatch = taskContent.match(/\*\*Task:\*\*\s*([^\n]+)/i);
                const categoryMatch = taskContent.match(/\*\*Category:\*\*\s*([^\n]+)/i);
                const descriptionMatch = taskContent.match(/\*\*Description:\*\*\s*([\s\S]*?)(?=\*\*Priority|\*\*Due|\*\*Steps|$)/i);
                const priorityMatch = taskContent.match(/\*\*Priority:\*\*\s*([^\n]+)/i);
                const dueDateMatch = taskContent.match(/\*\*Due:\*\*\s*([^\n]+)/i);
                const stepsMatch = taskContent.match(/\*\*Steps:\*\*([\s\S]*?)(?=\*\*Resources|$)/i);
                
                // Extract steps section
                const steps = stepsMatch ? stepsMatch[1].trim() : '';
                console.log('Steps:', steps ? '✅ Found' : '❌ Not found');

                // Extract resources section
                const resourcesMatch = taskContent.match(/\*\*Resources:\*\*([\s\S]*?)(?=\*\*Additional|$)/i);
                const resources = resourcesMatch ? resourcesMatch[1].trim() : '';
                console.log('Resources:', resources ? '✅ Found' : '❌ Not found');

                // Extract additional tips section
                const tipsMatch = taskContent.match(/\*\*Additional tips:\*\*([\s\S]*?)$/i);
                const tips = tipsMatch ? tipsMatch[1].trim() : '';
                console.log('Tips:', tips ? '✅ Found' : '❌ Not found');

                // Get the title from either the task content or initial message
                let title = '';
                if (taskMatch) {
                    title = taskMatch[1].trim();
                    console.log('\n✅ Title found in formatted content:', title);
                } else if (initialTitleMatch) {
                    title = initialTitleMatch[1].trim();
                    console.log('\n✅ Title found in original message:', title);
                }

                if (!title) {
                    console.log('\n❌ Cannot save task: No title found');
                    return {
                        success: false,
                        error: 'No task title found',
                        aiResponse: 'Please provide a title for your task. For example, tell me what the task is about.'
                    };
                }

                // Combine all sections into a detailed description
                const fullDescription = `Description:
${descriptionMatch ? descriptionMatch[1].trim() : 'No description provided'}

Steps:
${steps || 'No steps provided'}

Resources:
${resources || 'No resources provided'}

Additional Tips:
${tips || 'No additional tips provided'}`;

                console.log('\n=== Preparing Task Details ===');
                const taskDetails = {
                    title: title,
                    description: fullDescription,
                    category: categoryMatch ? categoryMatch[1].trim() : 'Other',
                    startDate: new Date(),
                    dueDate: dueDateMatch ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    priority: priorityMatch ? priorityMatch[1].toLowerCase() : 'medium',
                    status: 'To Do'
                };

                // Use the validation flow instead of direct creation
                const response = await this.createTask(userId, taskDetails);
                return {
                    success: true,
                    aiResponse: response
                };

            } else if (intent === 'update task') {
                // Check if this is just an initial update request without details
                const isInitialUpdateRequest = message.toLowerCase().match(/^(hello|hi|hey)?.*(update|change|modify).*(my)?.*tasks?.*$/i) && 
                    !message.includes(':') && 
                    message.length < 50 && 
                    !message.includes('status') && 
                    !message.includes('priority') && 
                    !message.includes('due');

                if (isInitialUpdateRequest) {
                    console.log('Initial task update request without details detected');
                    return {
                        success: true,
                        aiResponse: `I'll help you update your tasks! 📝

To update a task, please let me know:
• Which task do you want to update? (the task title)
• What would you like to change?

You can update:
• Status (To Do, In Progress, Done)
• Priority (high, medium, low)
• Category
• Due Date
• Description

For example:
• "Update task: Frontend Design, change status to In Progress"
or
"Update task: Database Setup, set priority to high"

First, which task would you like to update?`
                    };
                }

                // Check if this is a request with just the task title
                const taskTitleMatch = message.match(/update task:\s*([^,]+),\s*(\w+(?:\s+\w+)?)\s*:\s*(.+)$/i) || 
                                     message.match(/update task:\s*([^,]+)(?:,|$)/i) || 
                                     message.match(/task "([^"]+)"/i);
                
                if (taskTitleMatch) {
                    const taskTitle = taskTitleMatch[1].trim();
                    const task = await Task.findOne({ 
                        title: new RegExp(taskTitle, 'i'),
                        user: userId 
                    });

                    if (!task) {
                        return {
                            success: false,
                            error: 'Task not found',
                            aiResponse: `I couldn't find a task with the title "${taskTitle}". Please check the task title and try again.`
                        };
                    }

                    try {
                        console.log('Processing message for updates:', message);
                        
                        // Extract task title from previous context if available
                        let taskTitle = '';
                        const taskTitleFromContext = message.match(/task "([^"]+)"/i) ||
                                                   message.match(/task:\s*([^,\n]+)/i);
                        if (taskTitleFromContext) {
                            taskTitle = taskTitleFromContext[1].trim();
                        }

                        // Initialize update data
                        const updateData = {};
                        let updateMessage = '';

                        // Helper function to process field update
                        const processFieldUpdate = (field, value, validValues = null) => {
                            if (validValues) {
                                const matchedValue = validValues.find(v => 
                                    v.toLowerCase() === value.toLowerCase() ||
                                    v.toLowerCase().replace(/\s+/g, '') === value.toLowerCase().replace(/\s+/g, '')
                                );
                                if (!matchedValue) {
                                    throw new Error(`Invalid ${field}. Please use one of: ${validValues.join(', ')}`);
                                }
                                return matchedValue;
                            }
                            return value;
                        };

                        // Generic field update pattern matching
                        const updatePatterns = [
                            { regex: /update task:\s*([^,]+),\s*(\w+(?:\s+\w+)?)\s*:\s*(.+)$/i, type: 'task_update' },
                            { regex: /^update\s+(\w+(?:\s+\w+)?)\s+to:?\s*(.+)$/i, type: 'update' },
                            { regex: /^set\s+(\w+(?:\s+\w+)?)\s+(?:to|as):?\s*(.+)$/i, type: 'set' },
                            { regex: /^change\s+(\w+(?:\s+\w+)?)\s+to:?\s*(.+)$/i, type: 'change' },
                            { regex: /^(\w+(?:\s+\w+)?)\s*:\s*(.+)$/i, type: 'direct' },
                            { regex: /^rename\s+(?:task|it)\s+to:?\s*(.+)$/i, type: 'rename' }
                        ];

                        let matched = false;
                        for (const pattern of updatePatterns) {
                            const match = message.match(pattern.regex);
                            if (match) {
                                let field, value;
                                if (pattern.type === 'task_update') {
                                    // Handle task update format: "Update task: TaskName, field: value"
                                    field = match[2].toLowerCase().replace(/\s+/g, '');
                                    value = match[3];
                                } else if (pattern.type === 'rename') {
                                    field = 'title';
                                    value = match[1];
                                } else {
                                    field = match[1].toLowerCase().replace(/\s+/g, '');
                                    value = match[2];
                                }
                                
                                const trimmedValue = value.trim();
                                console.log(`Matched pattern type: ${pattern.type}, field: ${field}, value: ${trimmedValue}`);

                                try {
                                    switch (field) {
                                        case 'title':
                                            // Clean up the title value
                                            let newTitle = trimmedValue;
                                            // Remove quotes if present
                                            newTitle = newTitle.replace(/^["']|["']$/g, '');
                                            
                                            if (!newTitle) {
                                                throw new Error('Title cannot be empty');
                                            }
                                            updateData.title = newTitle;
                                            updateMessage = `title to "${newTitle}"`;
                                            matched = true;
                                            console.log('Title update matched:', updateData);
                                            break;
                                            
                                        case 'status':
                                            // Map common status variations to valid enum values
                                            const statusMap = {
                                                'todo': 'To Do',
                                                'to-do': 'To Do',
                                                'to_do': 'To Do',
                                                'inprogress': 'In Progress',
                                                'in-progress': 'In Progress',
                                                'in_progress': 'In Progress',
                                                'done': 'Done',
                                                'completed': 'Done',
                                                'finish': 'Done',
                                                'finished': 'Done'
                                            };
                                            
                                            const normalizedStatus = trimmedValue.toLowerCase().replace(/\s+/g, '');
                                            const mappedStatus = statusMap[normalizedStatus] || 
                                                               (trimmedValue === 'In Progress' ? trimmedValue : null);
                                            
                                            if (!mappedStatus) {
                                                throw new Error('Invalid status. Please use one of: To Do, In Progress, Done');
                                            }
                                            
                                            updateData.status = mappedStatus;
                                            updateMessage = `status to "${mappedStatus}"`;
                                            matched = true;
                                            break;

                                        case 'priority':
                                            const validPriority = processFieldUpdate('priority', trimmedValue, ['high', 'medium', 'low']);
                                            updateData.priority = validPriority;
                                            updateMessage = `priority to "${validPriority}"`;
                                            matched = true;
                                            break;

                                        case 'category':
                                            updateData.category = trimmedValue;
                                            updateMessage = `category to "${trimmedValue}"`;
                                            matched = true;
                                            break;

                                        case 'description':
                                            updateData.description = trimmedValue;
                                            updateMessage = `description to "${trimmedValue}"`;
                                            matched = true;
                                            break;

                                        case 'duedate':
                                        case 'due':
                                            let dueDate;
                                            const dateText = trimmedValue.toLowerCase();
                                            if (dateText.includes('next week')) {
                                                dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                                            } else if (dateText.includes('tomorrow')) {
                                                dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                                            } else if (dateText.includes('today')) {
                                                dueDate = new Date();
                                            } else if (dateText.includes('next month')) {
                                                dueDate = new Date();
                                                dueDate.setMonth(dueDate.getMonth() + 1);
                                            } else {
                                                dueDate = new Date(dateText);
                                                if (isNaN(dueDate.getTime())) {
                                                    throw new Error('Invalid date format');
                                                }
                                            }
                                            updateData.dueDate = dueDate;
                                            updateMessage = `due date to "${dueDate.toLocaleDateString()}"`;
                                            matched = true;
                                            break;
                                    }
                                } catch (error) {
                                    console.error(`Error processing ${field} update:`, error);
                                    return {
                                        success: false,
                                        error: error.message,
                                        aiResponse: `Error updating ${field}: ${error.message}`
                                    };
                                }
                            }
                        }

                        if (!matched) {
                            return {
                                success: true,
                                aiResponse: `I found the task "${task.title}", but I'm not sure what you want to update. You can:

• Change title (e.g., "title: New Title" or "rename task to: New Title")
• Change status (To Do, In Progress, Done)
• Set priority (high, medium, low)
• Change category
• Set due date
• Update description

For example:
• "title: Updated Task Name"
• "status: In Progress"
• "priority: high"
• "description: new details"`
                            };
                        }

                        // If we have updates to make
                        if (Object.keys(updateData).length > 0) {
                            try {
                                console.log('Attempting to update task with data:', updateData);
                                
                                // First verify the task exists
                                const existingTask = await Task.findById(task._id);
                                if (!existingTask) {
                                    console.error('Task not found before update');
                                    return {
                                        success: false,
                                        error: 'Task not found',
                                        aiResponse: 'Sorry, I could not find the task to update. Please try again.'
                                    };
                                }

                                // Perform the update
                                const updatedTask = await Task.findByIdAndUpdate(
                                    task._id,
                                    { $set: updateData },
                                    { new: true, runValidators: true }
                                );

                                if (!updatedTask) {
                                    console.error('Update operation failed');
                                    return {
                                        success: false,
                                        error: 'Update failed',
                                        aiResponse: 'Sorry, I was unable to update the task. Please try again.'
                                    };
                                }

                                console.log('Task updated successfully:', updatedTask);
                                const notification = new Notification({
                                    userId: userId,
                                    title: 'Task Updated',
                                    message: `AI Assistant updated task: ${updatedTask.title}`,
                                    type: 'update',
                                    read: false
                                });
                                await notification.save();

                                return {
                                    success: true,
                                    task: updatedTask,
                                    aiResponse: `✅ Updated task ${updateMessage}

Current Details:
• Title: ${updatedTask.title}
• Status: ${updatedTask.status}
• Priority: ${updatedTask.priority}
• Category: ${updatedTask.category}
• Due Date: ${updatedTask.dueDate.toLocaleDateString()}
${updatedTask.description ? `• Description: ${updatedTask.description}` : ''}`
                                };
                            } catch (error) {
                                console.error('Error during task update:', error);
                                return {
                                    success: false,
                                    error: error.message,
                                    aiResponse: `Sorry, there was an error updating the task: ${error.message}. Please try again.`
                                };
                            }
                        }

                        // If no specific update was recognized
                        return {
                            success: true,
                            aiResponse: `I found the task "${task.title}", but I'm not sure what you want to update. You can:

• Change title (e.g., "title: New Title" or "rename task to: New Title")
• Change status (To Do, In Progress, Done)
• Set priority (high, medium, low)
• Change category
• Set due date
• Update description

For example:
• "title: Updated Task Name"
• "status: In Progress"
• "priority: high"
• "description: new details"`
                        };
                    } catch (error) {
                        console.error('Error processing update:', error);
                        return {
                            success: false,
                            error: error.message,
                            aiResponse: 'Sorry, I had trouble processing your update. Please try again.'
                        };
                    }
                }
            } else if (intent === 'list tasks') {
                console.log('\n=== Processing List Tasks Request ===');
                
                try {
                    // Check if there are any tasks in progress of being updated
                    const inProgressTasks = await Task.find({ 
                        user: userId,
                        status: { $in: ['To Do', 'In Progress'] }
                    });

                    if (inProgressTasks.length === 0) {
                        console.log('No tasks found');
                        return {
                            success: true,
                            aiResponse: `📝 You don't have any tasks yet!

Would you like to create your first task? Just say something like:
• "Create a new task"
• "Add task: [your task title]"
• "Create task: [task title] with priority high"

I'll help you organize and track your tasks effectively! 🚀`
                        };
                    }

                    // Sort tasks by status and then alphabetically by title
                    const tasks = await Task.find({ user: userId })
                        .sort({ status: 1, title: 1 });
                    
                    console.log('Found tasks:', tasks.length);

                    // Group tasks by status
                    const tasksByStatus = {
                        'To Do': [],
                        'In Progress': [],
                        'Done': []
                    };

                    tasks.forEach(task => {
                        if (tasksByStatus[task.status]) {
                            tasksByStatus[task.status].push(task);
                        }
                    });

                    // Format tasks list grouped by status
                    let tasksList = '';
                    for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
                        if (statusTasks.length > 0) {
                            tasksList += `\n${status} (${statusTasks.length}):\n`;
                            tasksList += statusTasks.map((task, index) => 
                                `${index + 1}. ${task.title} (${task.priority} priority)`
                            ).join('\n');
                            tasksList += '\n';
                        }
                    }

                    const response = `📋 Your Tasks (${tasks.length} total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${tasksList}
Need to update a task? Just say "Update task: [task title]" 📝
Want to add another task? Say "Create new task" ✨`;

                    console.log('Formatted response:', response);
                    return {
                        success: true,
                        aiResponse: response
                    };

                } catch (error) {
                    console.error('❌ Task listing error:', error);
                    return {
                        success: false,
                        error: error.message,
                        aiResponse: 'Sorry, there was an error listing your tasks. Please try again.'
                    };
                }
            } else if (intent === 'general_conversation') {
                return {
                    success: true,
                    aiResponse: await this.getGeneralConversationResponse(message)
                };
            } else {
                // For non-task messages, get AI response
                const aiResponse = await this.getAIResponse(message, conversationHistory);
                return {
                    success: true,
                    aiResponse
                };
            }
        } catch (error) {
            console.error('\n❌ Error in processMessage:', error);
            console.error('Stack trace:', error.stack);
            return {
                success: false,
                error: error.message,
                aiResponse: 'Sorry, there was an error processing your request. Please try again.'
            };
        }
    }

    async extractTaskFromContext(message, conversationHistory) {
        // Try to get task title from the message first
        const directTaskMatch = message.match(/(?:delete|remove|erase|cancel|clear|trash|bin)\s+(?:the\s+)?(?:task|todo|to-do|item|reminder|activity)\s*[":]\s*"?([^",]+)"?/i) ||
                              message.match(/(?:delete|remove|erase|cancel|clear|trash|bin)\s+(?:the\s+)?(?:task|todo|to-do|item|reminder|activity)\s+(?:called|named|titled|labeled|marked\s+as)\s+\"?([^",]+)\"?/i) ||
                              message.match(/(?:delete|remove|erase|cancel|clear|trash|bin)\s+(?:the\s+)?(?:task|todo|to-do|item|reminder|activity)\s+([^",]+)$/i) ||
                              message.match(/(?:get\s+rid\s+of|eliminate|wipe\s+out|throw\s+away|dispose\s+of)\s+(?:the\s+)?(?:task|todo|to-do|item|reminder|activity)\s+\"?([^",]+)\"?/i) ||
                              message.match(/(?:can\s+you\s+)?(?:please\s+)?(?:delete|remove)\s+(?:the\s+)?(?:task|todo|to-do|item)\s+\"?([^",]+)\"?\s+(?:for\s+me)?/i) ||
                              message.match(/(?:i\s+want\s+to|i\'d\s+like\s+to)\s+(?:delete|remove)\s+(?:the\s+)?(?:task|todo|to-do|item)\s+\"?([^",]+)\"?/i) ||
                              message.match(/(?:mark|set)\s+(?:task|it)\s+\"?([^",]+)\"?\s+(?:as\s+)?(?:deleted|removed|done|completed|finished)/i);

        if (directTaskMatch) {
            return directTaskMatch[1].trim();
        }

        // If not found in message, check conversation history
        const lastTaskMention = conversationHistory
            .slice()
            .reverse()
            .find(msg => {
                const text = msg.message.toLowerCase();
                return text.includes('task "') || text.includes('task:') || 
                       text.includes('found the task "');
            });

        if (lastTaskMention) {
            const taskMatch = lastTaskMention.message.match(/task "([^"]+)"/i) || 
                            lastTaskMention.message.match(/task:\s*([^,\n]+)/i) ||
                            lastTaskMention.message.match(/found the task "([^"]+)"/i);
            
            if (taskMatch) {
                return taskMatch[1].trim();
            }
        }

        return null;
    }

    async getTaskHelpResponse() {
        // Let Gemini AI handle the conversation
        const prompt = `Please provide a helpful response for task management.`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    async toggleFavorite(req, res) {
        try {
            const { id } = req.params;
            const { favorite } = req.body;
            const userId = req.user.id;

            const conversation = await Conversation.findOne({ _id: id, userId });
            
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }

            conversation.favorite = favorite;
            await conversation.save();

            res.json({ success: true, favorite: conversation.favorite });
        } catch (error) {
            console.error('Error toggling favorite status:', error);
            res.status(500).json({ success: false, message: 'Error toggling favorite status' });
        }
    }
}

export default new chatbotController();