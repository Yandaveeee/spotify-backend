import { v2 as cloudinary } from "cloudinary";
import songModel from "../models/songModel.js";

const addSong = async (req, res) => {
    try {
        console.log("Files received:", req.files);
        console.log("Body received:", req.body);

        const name = req.body.name;
        const desc = req.body.desc;
        const album = req.body.album;
        const lyrics = req.body.lyrics || "";
        
        if (!req.files || !req.files.audio || !req.files.image) {
            return res.json({ success: false, message: "Audio and image files are required" });
        }

        const audioFile = req.files.audio[0];
        const imageFile = req.files.image[0];
        const videoFile = req.files.video ? req.files.video[0] : null;

        console.log("Uploading audio...");
        const audioUpload = await cloudinary.uploader.upload(audioFile.path, { resource_type: "video" });
        
        console.log("Uploading image...");
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        
        let videoUpload = null;
        if (videoFile) {
            console.log("Uploading video...");
            videoUpload = await cloudinary.uploader.upload(videoFile.path, { 
                resource_type: "video",
                folder: "songs/videos"
            });
            console.log("Video uploaded:", videoUpload.secure_url);
        }

        const duration = `${Math.floor(audioUpload.duration / 60)}:${Math.floor(audioUpload.duration % 60)}`;

        const songData = {
            name,
            desc,
            album,
            image: imageUpload.secure_url,
            file: audioUpload.secure_url,
            duration,
            lyrics,
            video: videoUpload ? videoUpload.secure_url : ""
        }

        console.log("Saving song data:", songData);
        const song = songModel(songData);
        await song.save();

        res.json({ success: true, message: "Song Added" });
    } catch (error) {
        console.error("Error adding song - Full error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        res.json({ success: false, message: error.message || "Unknown error occurred" });
    }
}

const listSong = async (req, res) => {
    try {
        const allSongs = await songModel.find({});
        res.json({ success: true, songs: allSongs });
    } catch (error) {
        res.json({ success: false });
    }
}

const removeSong = async (req, res) => {
    try {
        await songModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Song removed" });
    } catch (error) {
        res.json({ success: false });
    }
}

const updateLyrics = async (req, res) => {
    try {
        const { id, lyrics } = req.body;
        if (!id) {
            return res.json({ success: false, message: "Song ID is required" });
        }

        const song = await songModel.findByIdAndUpdate(
            id,
            { lyrics: lyrics || "" },
            { new: true }
        );

        if (!song) {
            return res.json({ success: false, message: "Song not found" });
        }

        res.json({ success: true, message: "Lyrics updated successfully", song });
    } catch (error) {
        console.error("Error updating lyrics:", error);
        res.json({ success: false, message: "Error updating lyrics" });
    }
}

export { addSong, listSong, removeSong, updateLyrics };