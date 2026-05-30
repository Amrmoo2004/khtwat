import { UserModel } from "../DB/models/user.model.js"; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';     

export const login = async (req, res) => {    
    const { email, password } = req.body; 

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password!' });
        }

        const user = await UserModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: 'student' },
            process.env.JWT_SECRET || 'super_secret_key_123',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                age: user.age
            }
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const signup = async (req, res) => {
    try {
        const { name, email, password, phone, age } = req.body;
             const hash =await bcrypt.hash(password, 12);
      
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }


        const newUser = await UserModel.create({
            name,
            email,
                  password: hash
,
            phone,
            age
        });

       

        // Generate token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: 'student' },
            process.env.JWT_SECRET || 'super_secret_key_123',
            { expiresIn: '7d' }
        );

        res.status(201).json({ message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                age: newUser.age
            }
        });

    } catch (error) {
        console.error("Error during signup:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { name, email, phone, age } = req.body;
        const userId = req.user?.id || req.params.id; 

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (email) {
            const existingUser = await UserModel.findOne({ email });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({ message: 'Email already exists.' });
            }
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { name, email, phone, age },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                age: updatedUser.age
            }
        });

    } catch (error) {
        console.error("Error during user update:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.id; // Fallback for testing

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const deletedUser = await UserModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error during user deletion:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getUser = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.id; // Fallback for testing

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                age: user.age
            }
        });
    } catch (error) {
        console.error("Error during fetching user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

