import express from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;

}

export const checkPermission = (requiredRole: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

      if (decoded.role !== requiredRole) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: "Invalid token" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

