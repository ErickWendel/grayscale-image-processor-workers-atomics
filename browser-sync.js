module.exports = {
    server: {
        baseDir: "./",
        middleware: [
            function (req, res, next) {
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                next();
            },
        ],
    },
    port: 8080,
};