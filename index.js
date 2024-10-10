const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

function fillTemplate(templatePath, data) {
	let template = fs.readFileSync(templatePath, "utf8");

	Object.keys(data).forEach((key) => {
		if (Array.isArray(data[key])) {
			const rows = data[key]
				.map(
					(row) =>
						`<tr><td>${row.item}</td><td>${row.quantity}</td><td>${row.price}</td></tr>`,
				)
				.join("");
			template = template.replace(`{{#each ${key}}}`, rows);
		} else {
			// Xử lý các giá trị đơn lẻ
			const regex = new RegExp(`{{${key}}}`, "g");
			template = template.replace(regex, data[key]);
		}
	});

	return template;
}

async function createPdfFromTemplate(data) {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		const htmlContent = fillTemplate(
			path.join(__dirname, "template.html"),
			data,
		);
		console.log("htmlContent: ", htmlContent);
		await page.setContent(htmlContent, { waitUntil: "networkidle0" });
		const pdfBuffer = await page.pdf({ format: "A4" });
		await browser.close();
		return pdfBuffer;
	} catch (error) {
		console.error("Error creating PDF:", error);
		throw error;
	}
}

const express = require("express");
const app = express();

app.get("/download-pdf", async (req, res) => {
	const data = {
		name: req.query.name || "John Doe",
		date: new Date().toLocaleDateString(),
		address: req.query.address || "123 Main St",
		content:
			req.query.content ||
			"This is a sample report content for demonstration purposes.",
		// Dữ liệu bảng
		tableData: [
			{ item: "Item A", quantity: 2, price: "$10" },
			{ item: "Item B", quantity: 5, price: "$25" },
			{ item: "Item C", quantity: 3, price: "$15" },
		],
	};

	try {
		const pdfBuffer = await createPdfFromTemplate(data);
		res.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": "attachment; filename=report.pdf",
			"Content-Length": pdfBuffer.length,
		});

		res.end(pdfBuffer, "binary");
	} catch (error) {
		console.error("Error generating PDF:", error);
		res.status(500).send("Error generating PDF");
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
