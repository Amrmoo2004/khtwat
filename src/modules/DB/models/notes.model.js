import mongoose from "mongoose";
const { Schema } = mongoose; 
const noteSchema = new Schema({
  title: { // Fixed spelling from 'tittle'
    type: String,
    required: true, 
    validate: {
      validator: function(v) {
        return v !== v.toUpperCase();
      },
      message: props => `Title '${props.value}' cannot be all uppercase`
    }
  },
  content: {    
    type: String,   
    required: true,
  },
  // Removed manual createdat/updatedat since we're using timestamps
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});
export const NoteModel = mongoose.model('Note', noteSchema);
