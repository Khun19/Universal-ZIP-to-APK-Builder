package com.example.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

data class GeminiFunctionCall(
    val name: String,
    val arguments: Map<String, String>
)

data class GeminiResponse(
    val text: String?,
    val functionCalls: List<GeminiFunctionCall>,
    val rawJson: String = ""
)

class GeminiApiClient {
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun testConnection(apiKey: String, model: String): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) {
            return@withContext Pair(false, "API Key is empty")
        }
        val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey"
        val payload = JSONObject().apply {
            put("contents", JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "user")
                    put("parts", JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", "Respond with 'READY' if you are operational.")
                        })
                    })
                })
            })
        }

        try {
            val req = Request.Builder()
                .url(url)
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            client.newCall(req).execute().use { response ->
                val body = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    Pair(true, "Connected to $model successfully!")
                } else {
                    val errMsg = try {
                        JSONObject(body).optJSONObject("error")?.optString("message") ?: body
                    } catch (_: Exception) {
                        body
                    }
                    Pair(false, "HTTP ${response.code}: $errMsg")
                }
            }
        } catch (e: Exception) {
            Pair(false, e.localizedMessage ?: "Network error")
        }
    }

    suspend fun callWithTools(
        apiKey: String,
        model: String,
        systemInstruction: String,
        conversationHistory: List<JSONObject>,
        includeTools: Boolean = true
    ): GeminiResponse = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) {
            throw IOException("Gemini API key is required. Please set it in Settings.")
        }

        val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey"

        val root = JSONObject().apply {
            put("contents", JSONArray(conversationHistory))
            put("systemInstruction", JSONObject().apply {
                put("parts", JSONArray().apply {
                    put(JSONObject().apply { put("text", systemInstruction) })
                })
            })

            if (includeTools) {
                put("tools", JSONArray().apply {
                    put(JSONObject().apply {
                        put("functionDeclarations", getDeclaredTools())
                    })
                })
            }
        }

        val req = Request.Builder()
            .url(url)
            .post(root.toString().toRequestBody(jsonMediaType))
            .build()

        client.newCall(req).execute().use { response ->
            val body = response.body?.string() ?: ""
            if (!response.isSuccessful) {
                val err = try {
                    JSONObject(body).optJSONObject("error")?.optString("message") ?: body
                } catch (_: Exception) { body }
                throw IOException("Gemini API error (HTTP ${response.code}): $err")
            }

            val json = JSONObject(body)
            val candidates = json.optJSONArray("candidates")
            val firstCandidate = candidates?.optJSONObject(0)
            val content = firstCandidate?.optJSONObject("content")
            val parts = content?.optJSONArray("parts")

            var textResult: String? = null
            val functionCalls = mutableListOf<GeminiFunctionCall>()

            if (parts != null) {
                for (i in 0 until parts.length()) {
                    val part = parts.getJSONObject(i)
                    if (part.has("text")) {
                        textResult = (textResult ?: "") + part.getString("text")
                    }
                    if (part.has("functionCall")) {
                        val fc = part.getJSONObject("functionCall")
                        val name = fc.getString("name")
                        val argsObj = fc.optJSONObject("args")
                        val argsMap = mutableMapOf<String, String>()
                        if (argsObj != null) {
                            val keys = argsObj.keys()
                            while (keys.hasNext()) {
                                val key = keys.next()
                                argsMap[key] = argsObj.optString(key, "")
                            }
                        }
                        functionCalls.add(GeminiFunctionCall(name, argsMap))
                    }
                }
            }

            GeminiResponse(
                text = textResult,
                functionCalls = functionCalls,
                rawJson = body
            )
        }
    }

    private fun getDeclaredTools(): JSONArray {
        return JSONArray().apply {
            // 1. project_status
            put(JSONObject().apply {
                put("name", "project_status")
                put("description", "Returns project path, git status, current build status, detected frameworks, completed features, and pending roadmap tasks.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject())
                })
            })

            // 2. list_files
            put(JSONObject().apply {
                put("name", "list_files")
                put("description", "Browse files within Universal-ZIP-to-APK-Builder. Rejects path escape and outside traversal.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("path", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Relative subpath to list, or empty for project root.")
                        })
                    })
                })
            })

            // 3. read_file
            put(JSONObject().apply {
                put("name", "read_file")
                put("description", "Read source file content in the project for analysis or debugging.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("filePath", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Relative path to file, e.g. 'package.json' or 'src/index.ts'.")
                        })
                    })
                    put("required", JSONArray().apply { put("filePath") })
                })
            })

            // 4. search_code
            put(JSONObject().apply {
                put("name", "search_code")
                put("description", "Search for symbols, function names, error patterns, or TODOs across project files.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("query", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Query string to search for.")
                        })
                    })
                    put("required", JSONArray().apply { put("query") })
                })
            })

            // 5. edit_file
            put(JSONObject().apply {
                put("name", "edit_file")
                put("description", "Modify an existing source file with corrected code.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("filePath", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Relative path to file.")
                        })
                        put("content", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "New content or changes.")
                        })
                        put("explanation", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Reason and summary of the modification.")
                        })
                    })
                    put("required", JSONArray().apply {
                        put("filePath")
                        put("content")
                        put("explanation")
                    })
                })
            })

            // 6. run_command
            put(JSONObject().apply {
                put("name", "run_command")
                put("description", "Execute command via Termux Agent (e.g. pnpm test, gradle commands, node scripts).")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("command", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Shell command to run.")
                        })
                    })
                    put("required", JSONArray().apply { put("command") })
                })
            })

            // 7. build_project
            put(JSONObject().apply {
                put("name", "build_project")
                put("description", "Run the Universal ZIP-to-APK Builder pipeline to construct a test or release APK.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("strategy", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Build strategy e.g. 'capacitor', 'native-android', or 'web-wrapper'.")
                        })
                    })
                })
            })

            // 8. verify_apk
            put(JSONObject().apply {
                put("name", "verify_apk")
                put("description", "Check APK existence, file size, SHA-256 hash, and structural validity.")
                put("parameters", JSONObject().apply {
                    put("type", "OBJECT")
                    put("properties", JSONObject().apply {
                        put("apkPath", JSONObject().apply {
                            put("type", "STRING")
                            put("description", "Path to APK file to inspect.")
                        })
                    })
                })
            })
        }
    }
}
