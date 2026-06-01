import { httpRouter } from "convex/server"
import { authKit } from "./auth"

const http = httpRouter()

// Serves the WorkOS webhook at <deployment>.convex.site/workos/webhook so
// user.created / user.updated / user.deleted events sync into Convex.
authKit.registerRoutes(http)

export default http
