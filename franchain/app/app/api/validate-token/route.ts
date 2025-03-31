import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { token } = req.body;

    try {
      const user = jwt.verify(token, "secretKey");
      return res.status(200).json({ user });
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
