@file:OptIn(ExperimentalMaterial3Api::class)

package com.fumak.scanner.ui.connection

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fumak.scanner.data.connection.ConnectionProfile
import com.fumak.scanner.data.connection.ConnectionProfileStore

/**
 * "Desktop Connection" settings: add/edit/delete saved desktop profiles (e.g. "Home",
 * "Office") and pick which one is active. Purely local CRUD over
 * [ConnectionProfileStore]'s own reactive state — no separate ViewModel needed,
 * matching this app's existing dependency-light style.
 */
@Composable
fun ConnectionSettingsScreen(
    profileStore: ConnectionProfileStore,
    onBack: () -> Unit,
) {
    val state by profileStore.state.collectAsState()
    var editingProfile by remember { mutableStateOf<ConnectionProfile?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }
    var deleteTarget by remember { mutableStateOf<ConnectionProfile?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Desktop Connection") },
                navigationIcon = { IconButton(onClick = onBack) { Text("←", fontSize = 20.sp) } },
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Text("+", fontSize = 24.sp)
            }
        },
    ) { padding ->
        if (state.profiles.isEmpty()) {
            Box(modifier = Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "No desktops saved yet. Tap + to add one, e.g. \"Home\" or \"Office\".",
                    modifier = Modifier.padding(32.dp),
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(padding).fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
            ) {
                items(state.profiles, key = { it.id }) { profile ->
                    ProfileRow(
                        profile = profile,
                        isActive = profile.id == state.activeProfileId,
                        onSelect = { profileStore.setActive(profile.id) },
                        onEdit = { editingProfile = profile },
                        onDelete = { deleteTarget = profile },
                    )
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }

    if (showAddDialog) {
        ProfileEditDialog(
            title = "Add Desktop",
            initial = null,
            onDismiss = { showAddDialog = false },
            onSave = { name, host, port ->
                profileStore.addOrUpdate(name, host, port)
                showAddDialog = false
            },
        )
    }

    editingProfile?.let { profile ->
        ProfileEditDialog(
            title = "Edit Desktop",
            initial = profile,
            onDismiss = { editingProfile = null },
            onSave = { name, host, port ->
                profileStore.addOrUpdate(name, host, port, id = profile.id)
                editingProfile = null
            },
        )
    }

    deleteTarget?.let { profile ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Remove \"${profile.name}\"?") },
            text = { Text("You can add it again later.") },
            confirmButton = {
                TextButton(onClick = { profileStore.remove(profile.id); deleteTarget = null }) { Text("Remove") }
            },
            dismissButton = { TextButton(onClick = { deleteTarget = null }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun ProfileRow(
    profile: ConnectionProfile,
    isActive: Boolean,
    onSelect: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onSelect),
        colors = if (isActive) {
            CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        } else {
            CardDefaults.cardColors()
        },
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(profile.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (isActive) {
                        Spacer(Modifier.width(8.dp))
                        Surface(shape = RoundedCornerShape(50), color = MaterialTheme.colorScheme.primary) {
                            Text(
                                "ACTIVE",
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            )
                        }
                    }
                }
                Text("${profile.host}:${profile.port}", style = MaterialTheme.typography.bodyMedium)
            }
            TextButton(onClick = onEdit) { Text("Edit") }
            TextButton(onClick = onDelete) { Text("Delete") }
        }
    }
}

@Composable
private fun ProfileEditDialog(
    title: String,
    initial: ConnectionProfile?,
    onDismiss: () -> Unit,
    onSave: (name: String, host: String, port: Int) -> Unit,
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var host by remember { mutableStateOf(initial?.host ?: "") }
    var port by remember { mutableStateOf((initial?.port ?: 3000).toString()) }
    val portValue = port.toIntOrNull()
    val canSave = name.isNotBlank() && host.isNotBlank() && portValue != null && portValue in 1..65535

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name (e.g. Home)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = host,
                    onValueChange = { host = it },
                    label = { Text("Desktop IP address") },
                    placeholder = { Text("192.168.1.23") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = port,
                    onValueChange = { port = it.filter(Char::isDigit) },
                    label = { Text("Port") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(name.trim(), host.trim(), portValue!!) }, enabled = canSave) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
