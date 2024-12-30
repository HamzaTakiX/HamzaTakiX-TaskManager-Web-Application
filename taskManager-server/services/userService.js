import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const createUser = async (userData) => {
    return await User.create(userData);
};

export const findUserByEmail = async (email) => {
    console.log('Finding user by email:', email);
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    return user;
};

export const findUserByEmailAndFullName = async (email, fullName) => {
    return await User.findOne({ email, fullName });
};

export const findUserById = async (id) => {
    console.log('Finding user by ID:', id);
    const user = await User.findById(id);
    console.log('User found:', user ? 'Yes' : 'No');
    return user;
};

export const deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id);
};

export const updateUserPassword = async (userId, newPassword) => {
    console.log('Updating password for user:', userId);
    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            console.log('No user found with ID:', userId);
            return null;
        }

        // Set new password - will be hashed by the model middleware
        user.password = newPassword;
        console.log('Saving new password to database');
        await user.save();
        
        // Verify the update
        const updatedUser = await User.findById(userId);
        console.log('Password updated successfully:', !!updatedUser);
        return updatedUser;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
};
