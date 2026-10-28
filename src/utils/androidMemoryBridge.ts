/**
 * Android Jarvis Smart Memory Integration Bridge
 * 
 * Provides production-ready Android Room & SharedPreferences implementation in Kotlin,
 * along with the @JavascriptInterface WebView bridge for bidirectional sync
 * between Web/AI Studio Jarvis and Native Android OS.
 */

export const ANDROID_ROOM_MEMORY_KOTLIN = `package com.jarvis.assistant.memory

import android.content.Context
import android.content.SharedPreferences
import androidx.room.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/**
 * 1. Room Database Entity for Persistent Memory Store
 * Stores structured key-value memories (e.g. name="Rovin", car_number="DL 01 AB").
 */
@Entity(tableName = "jarvis_smart_memory")
data class MemoryEntity(
    @PrimaryKey
    val key: String,
    val value: String,
    val category: String = "personal",
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * 2. Room Data Access Object (DAO)
 */
@Dao
interface MemoryDao {
    @Query("SELECT * FROM jarvis_smart_memory ORDER BY updatedAt DESC")
    fun getAllMemoriesFlow(): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM jarvis_smart_memory ORDER BY updatedAt DESC")
    suspend fun getAllMemories(): List<MemoryEntity>

    @Query("SELECT value FROM jarvis_smart_memory WHERE LOWER(key) = LOWER(:key) LIMIT 1")
    suspend fun getMemory(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMemory(item: MemoryEntity)

    @Query("DELETE FROM jarvis_smart_memory WHERE LOWER(key) = LOWER(:key)")
    suspend fun deleteMemory(key: String)

    @Query("DELETE FROM jarvis_smart_memory")
    suspend fun clearAllMemories()
}

/**
 * 3. Room Database
 */
@Database(entities = [MemoryEntity::class], version = 1, exportSchema = false)
abstract class JarvisMemoryDatabase : RoomDatabase() {
    abstract fun memoryDao(): MemoryDao

    companion object {
        @Volatile
        private var INSTANCE: JarvisMemoryDatabase? = null

        fun getDatabase(context: Context): JarvisMemoryDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    JarvisMemoryDatabase::class.java,
                    "jarvis_memory.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

/**
 * 4. Dual-Store Memory Manager:
 * Uses both Android SharedPreferences (fast synchronous key-value)
 * and Android Room SQLite Database (queryable, persistent across app lifecycle & reboots).
 */
class JarvisMemoryManager(private val context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("jarvis_smart_memory_prefs", Context.MODE_PRIVATE)
    private val db = JarvisMemoryDatabase.getDatabase(context)
    private val dao = db.memoryDao()

    /**
     * saveMemory(key, value)
     * Saves or overwrites a user-defined memory item in structured JSON and Room DB.
     */
    suspend fun saveMemory(key: String, value: String, category: String = "personal") = withContext(Dispatchers.IO) {
        val cleanKey = key.trim().lowercase()
        val cleanVal = value.trim()

        // 1. Save to SharedPreferences for instant synchronous lookups
        prefs.edit().putString("mem_$cleanKey", cleanVal).apply()

        // 2. Persist to Room SQLite Database
        val entity = MemoryEntity(
            key = cleanKey,
            value = cleanVal,
            category = category,
            updatedAt = System.currentTimeMillis()
        )
        dao.saveMemory(entity)
    }

    /**
     * getMemory(key)
     * Retrieves stored value by key. Checks SharedPreferences first, then Room DB.
     */
    suspend fun getMemory(key: String): String? = withContext(Dispatchers.IO) {
        val cleanKey = key.trim().lowercase()
        prefs.getString("mem_$cleanKey", null) ?: dao.getMemory(cleanKey)
    }

    /**
     * updateMemory(key, value)
     * Overwrites existing memory with updated information.
     */
    suspend fun updateMemory(key: String, value: String): Boolean = withContext(Dispatchers.IO) {
        saveMemory(key, value)
        true
    }

    /**
     * deleteMemory(key)
     * Removes a specific memory item.
     */
    suspend fun deleteMemory(key: String): Boolean = withContext(Dispatchers.IO) {
        val cleanKey = key.trim().lowercase()
        prefs.edit().remove("mem_$cleanKey").apply()
        dao.deleteMemory(cleanKey)
        true
    }

    /**
     * clearAllMemories()
     * Removes all stored memories completely.
     */
    suspend fun clearAllMemories() = withContext(Dispatchers.IO) {
        prefs.edit().clear().apply()
        dao.clearAllMemories()
    }

    /**
     * getAllMemoriesJson()
     * Serializes all memories as structured JSON for the conversation engine.
     */
    suspend fun getAllMemoriesJson(): String = withContext(Dispatchers.IO) {
        val list = dao.getAllMemories()
        val jsonArray = JSONArray()
        list.forEach { item ->
            val obj = JSONObject()
            obj.put("key", item.key)
            obj.put("value", item.value)
            obj.put("category", item.category)
            obj.put("updatedAt", item.updatedAt)
            jsonArray.put(obj)
        }
        jsonArray.toString()
    }
}
`;

export const ANDROID_WEBVIEW_BRIDGE_KOTLIN = `package com.jarvis.assistant.bridge

import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.jarvis.assistant.memory.JarvisMemoryManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * 5. Android WebView JavaScriptInterface
 * Connects Web / AI Studio Jarvis assistant with Native Android device memory.
 * 
 * In your MainActivity:
 * val memoryManager = JarvisMemoryManager(this)
 * webView.addJavascriptInterface(JarvisMemoryWebInterface(webView, memoryManager), "AndroidMemoryBridge")
 */
class JarvisMemoryWebInterface(
    private val webView: WebView,
    private val memoryManager: JarvisMemoryManager
) {
    private val scope = CoroutineScope(Dispatchers.Main)

    @JavascriptInterface
    fun saveMemory(key: String, value: String) {
        scope.launch(Dispatchers.IO) {
            memoryManager.saveMemory(key, value)
        }
    }

    @JavascriptInterface
    fun getMemory(key: String): String {
        var result = ""
        kotlinx.coroutines.runBlocking {
            result = memoryManager.getMemory(key) ?: ""
        }
        return result
    }

    @JavascriptInterface
    fun updateMemory(key: String, value: String) {
        scope.launch(Dispatchers.IO) {
            memoryManager.updateMemory(key, value)
        }
    }

    @JavascriptInterface
    fun deleteMemory(key: String) {
        scope.launch(Dispatchers.IO) {
            memoryManager.deleteMemory(key)
        }
    }

    @JavascriptInterface
    fun clearAllMemories() {
        scope.launch(Dispatchers.IO) {
            memoryManager.clearAllMemories()
        }
    }

    @JavascriptInterface
    fun getAllMemories(): String {
        var json = "[]"
        kotlinx.coroutines.runBlocking {
            json = memoryManager.getAllMemoriesJson()
        }
        return json
    }
}
`;

export const ANDROID_SETUP_INSTRUCTIONS_MARKDOWN = `
# How to Connect the Smart Memory System to your Android Jarvis App

### Step 1: Add Room dependencies to \`app/build.gradle.kts\`
\`\`\`kotlin
dependencies {
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
\`\`\`

### Step 2: Initialize Memory Manager & WebView Bridge in \`MainActivity.kt\`
\`\`\`kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var memoryManager: JarvisMemoryManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        memoryManager = JarvisMemoryManager(this)
        webView = findViewById(R.id.jarvisWebView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
        }

        // Expose Native Android Bridge to Jarvis JavaScript runtime:
        webView.addJavascriptInterface(
            JarvisMemoryWebInterface(webView, memoryManager),
            "AndroidMemoryBridge"
        )

        webView.loadUrl("https://your-jarvis-app-url.run.app")
    }
}
\`\`\`

### Step 3: Usage in Jarvis Conversation
- Input: *"My name is Rovin, remember this"*
- Jarvis calls \`saveMemory("name", "Rovin")\`
- Automatically saved into Android SharedPreferences & Room Database!
- Next conversation: *"Hello"* -> Jarvis responds *"Hello Rovin, how can I help you?"*
`;
