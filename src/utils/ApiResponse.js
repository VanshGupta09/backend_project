class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode,
            this.data = data,
            this.message = message,
            // because status code greater then 400 are classified as errors
            this.success = statusCode < 400
    }
}

export default ApiResponse