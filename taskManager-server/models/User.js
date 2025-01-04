import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    job: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true,
        default: 'NO foun Number'
    },
    languages: {
        type: String,
        required: false,
        trim: true,
        default: 'English'
    },
    location: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    about: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    skills: {
        type: [String],
        default: []
    },
    profileImage: {
        type: String,
        default: 'none'
    },
    bannerImage: {
        type: String,
        default: 'none'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    joinedDate: {
        type: Date,
        default: Date.now
    },
    notificationSettings: {
        taskNotifs: { type: Boolean, default: true },
        taskReminders: { type: Boolean, default: true },
        errorNotifs: { type: Boolean, default: true },
        successNotifs: { type: Boolean, default: true },
        settingsNotifs: { type: Boolean, default: true },
        updateNotifs: { type: Boolean, default: true },
        profileNotifs: { type: Boolean, default: true }
    },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) {
            console.log('Password not modified, skipping hash');
            return next();
        }

        console.log('Hashing password');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully');
        next();
    } catch (error) {
        console.error('Error in password hash middleware:', error);
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        if (!this.password) {
            console.error('No password hash stored');
            return false;
        }
        if (!candidatePassword) {
            console.error('No candidate password provided');
            return false;
        }
        
        console.log('Comparing passwords');
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('Password comparison result:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};

export default mongoose.model('User', userSchema);
