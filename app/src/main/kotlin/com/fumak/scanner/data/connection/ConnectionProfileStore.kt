package com.fumak.scanner.data.connection

import android.content.Context
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ConnectionState(
    val profiles: List<ConnectionProfile> = emptyList(),
    val activeProfileId: String? = null,
) {
    val activeProfile: ConnectionProfile? get() = profiles.find { it.id == activeProfileId }
}

/**
 * Lightweight local persistence for saved desktop connection profiles. Plain
 * SharedPreferences with hand-rolled tab/newline-delimited encoding — no JSON
 * library or DataStore needed for what's at most a handful of {name, host, port}
 * records. Exposes a [StateFlow] so the scanner screen picks up changes made in the
 * connections settings screen immediately.
 */
class ConnectionProfileStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val _state = MutableStateFlow(load())
    val state: StateFlow<ConnectionState> = _state.asStateFlow()

    /** Adds a new profile, or updates one in place when [id] matches an existing profile. */
    fun addOrUpdate(name: String, host: String, port: Int, id: String? = null) {
        val current = _state.value
        val profile = ConnectionProfile(id ?: UUID.randomUUID().toString(), name, host, port)
        val updated = current.profiles.filterNot { it.id == profile.id } + profile
        // The first profile ever saved becomes active automatically.
        val activeId = current.activeProfileId ?: profile.id
        persist(ConnectionState(updated, activeId))
    }

    fun remove(id: String) {
        val current = _state.value
        val updated = current.profiles.filterNot { it.id == id }
        val activeId = if (current.activeProfileId == id) updated.firstOrNull()?.id else current.activeProfileId
        persist(ConnectionState(updated, activeId))
    }

    fun setActive(id: String) {
        persist(_state.value.copy(activeProfileId = id))
    }

    private fun persist(state: ConnectionState) {
        prefs.edit()
            .putString(KEY_PROFILES, state.profiles.joinToString("\n") { encode(it) })
            .putString(KEY_ACTIVE_ID, state.activeProfileId)
            .apply()
        _state.value = state
    }

    private fun load(): ConnectionState {
        val raw = prefs.getString(KEY_PROFILES, null).orEmpty()
        val profiles = raw.lineSequence().filter { it.isNotBlank() }.mapNotNull(::decode).toList()
        val activeId = prefs.getString(KEY_ACTIVE_ID, null)
        return ConnectionState(profiles, activeId ?: profiles.firstOrNull()?.id)
    }

    private fun encode(profile: ConnectionProfile): String =
        listOf(profile.id, profile.name, profile.host, profile.port.toString()).joinToString("\t")

    private fun decode(line: String): ConnectionProfile? {
        val parts = line.split("\t")
        if (parts.size != 4) return null
        val port = parts[3].toIntOrNull() ?: return null
        return ConnectionProfile(id = parts[0], name = parts[1], host = parts[2], port = port)
    }

    companion object {
        private const val PREFS_NAME = "fumak_connections"
        private const val KEY_PROFILES = "profiles"
        private const val KEY_ACTIVE_ID = "active_profile_id"
    }
}
