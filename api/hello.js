// Ultra-simple endpoint with no imports or dependencies
export default function handler(req, res) {
  res.status(200).json({
    message: "Hello World!",
    time: new Date().toISOString(),
  });
}
