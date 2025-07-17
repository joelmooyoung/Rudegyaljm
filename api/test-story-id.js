export default function handler(req, res) {
  const { id } = req.query;

  return res.status(200).json({
    success: true,
    message: "New API endpoint is working",
    receivedId: id,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}
