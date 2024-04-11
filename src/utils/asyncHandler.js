//function with another (fn) function as parameter
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (err) {
        // to send the error status in json form to user
        res.status(err.statusCode || 500).json({
            sucess: false,
            message: err.message
        })
    }
}

// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res,next))
//             .catch((err) => {
//                 next(err);
//             })
//     }
// }

export default asyncHandler;
