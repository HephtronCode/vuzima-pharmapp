import { app } from './app.js'
import { env } from './config.js'

app.listen(env.API_PORT, () => {
  console.log(`Vuzima API running on http://localhost:${env.API_PORT}`)
})
