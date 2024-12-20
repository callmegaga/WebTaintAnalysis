const express = require('express');
const path = require('path');

const app = express();
const port = 3001;

app.use(express.static(__dirname)); // 提供静态文件服务
app.get('/echo', (req, res) => {
	res.send(req.query.data);
});

app.listen(port, () => {
	console.log(`Report server running at http://127.0.0.1:${port}/report.html`);
});
