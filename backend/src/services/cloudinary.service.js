import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

export const uploadImageBuffer = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      return resolve({ url: result.secure_url, publicId: result.public_id });
    });

    Readable.from(file.buffer).pipe(stream);
  });

export const uploadFileBuffer = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", use_filename: true, unique_filename: true },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        });
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
