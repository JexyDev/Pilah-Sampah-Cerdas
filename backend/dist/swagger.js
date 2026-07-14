import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Pilah Sampah Cerdas API Documentation",
            version: "1.0.0",
            description: "Dokumentasi API untuk sistem manajemen pilah sampah cerdas (pilahsampah.id)",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development Server",
            },
        ],
    },
    // Path to the API docs (both source TS and compiled JS files)
    apis: ["./src/routes/*.ts", "./src/routes/*.js", "./dist/routes/*.js"],
};
const swaggerSpec = swaggerJSDoc(options);
export function setupSwagger(app) {
    // Swagger UI page
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    // Docs in JSON format
    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
    console.log("Swagger documentation initialized at http://localhost:3000/api-docs");
}
