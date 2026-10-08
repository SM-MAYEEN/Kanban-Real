import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Task } from '../models/Task.js';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// @route POST /api/tasks/:taskId/upload-url
export const getPresignedUploadUrl = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { fileName, fileType } = req.body;

    const uniqueKey = `attachments/${taskId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: fileType,
    });

    // 5 min valid pre-signed URL generate hobe
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

    res.json({ uploadUrl, fileUrl, fileName, fileType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/tasks/:taskId/attachments
export const saveTaskAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { fileUrl, fileName, fileType } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.attachments.push({
      url: fileUrl,
      fileName,
      fileType,
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};