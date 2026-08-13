package com.fumak.scanner.ui.scanner

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.fumak.scanner.data.connection.ConnectionProfile
import com.fumak.scanner.data.connection.ConnectionProfileStore
import com.fumak.scanner.network.BarcodeSender
import com.fumak.scanner.network.SendResult
import com.fumak.scanner.scanner.BarcodeScanResult
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface SendState {
    data object Idle : SendState
    data object Sending : SendState
    data object Sent : SendState
    data class Failed(val message: String) : SendState
}

enum class ConnectionStatus { UNKNOWN, CONNECTED, NOT_CONNECTED }

private const val HEARTBEAT_INTERVAL_MS = 5_000L
private const val SENT_DISPLAY_MS = 1_500L

/**
 * Scanner-only ViewModel: forwards every decoded barcode to the active
 * [ConnectionProfile] via [BarcodeSender] and tracks connection/send status. Does
 * NOT look up product data or touch any local database — the desktop owns all of
 * that via its existing POS.
 */
class SendViewModel(private val profileStore: ConnectionProfileStore) : ViewModel() {
    private val _sendState = MutableStateFlow<SendState>(SendState.Idle)
    val sendState: StateFlow<SendState> = _sendState.asStateFlow()

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.UNKNOWN)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    val activeProfile: StateFlow<ConnectionProfile?> = profileStore.state
        .map { it.activeProfile }
        .stateIn(viewModelScope, SharingStarted.Eagerly, profileStore.state.value.activeProfile)

    // Guards against a burst of camera callbacks for the same physical scan turning
    // into more than one network send — on top of the scanner engine's own
    // per-barcode-value cooldown.
    private var isSending = false

    init {
        viewModelScope.launch {
            while (true) {
                heartbeatOnce()
                delay(HEARTBEAT_INTERVAL_MS)
            }
        }
    }

    private suspend fun heartbeatOnce() {
        val profile = activeProfile.value
        if (profile == null) {
            _connectionStatus.value = ConnectionStatus.NOT_CONNECTED
            return
        }
        val result = BarcodeSender.sendHeartbeat(profile)
        _connectionStatus.value = if (result is SendResult.Success) ConnectionStatus.CONNECTED else ConnectionStatus.NOT_CONNECTED
    }

    fun onBarcodeScanned(result: BarcodeScanResult) {
        if (isSending) return

        val profile = activeProfile.value
        if (profile == null) {
            _sendState.value = SendState.Failed("No desktop selected")
            return
        }

        viewModelScope.launch {
            isSending = true
            _sendState.value = SendState.Sending
            val outcome = BarcodeSender.sendBarcode(profile, result.value, result.format.name)
            isSending = false
            when (outcome) {
                is SendResult.Success -> {
                    _connectionStatus.value = ConnectionStatus.CONNECTED
                    _sendState.value = SendState.Sent
                    delay(SENT_DISPLAY_MS)
                    // Only revert if nothing newer has already overwritten this state.
                    if (_sendState.value == SendState.Sent) _sendState.value = SendState.Idle
                }
                is SendResult.Failed -> {
                    _connectionStatus.value = ConnectionStatus.NOT_CONNECTED
                    _sendState.value = SendState.Failed(outcome.message)
                }
            }
        }
    }

    companion object {
        fun factory(profileStore: ConnectionProfileStore) = viewModelFactory {
            initializer { SendViewModel(profileStore) }
        }
    }
}
