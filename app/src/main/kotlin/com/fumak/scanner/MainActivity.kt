package com.fumak.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.fumak.scanner.scanner.BarcodeScanResult
import com.fumak.scanner.scanner.BarcodeScannerEngine
import com.fumak.scanner.scanner.MlKitBarcodeScannerEngine
import com.fumak.scanner.scanner.ScannerConfig
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : ComponentActivity() {

    private val scannerEngine: BarcodeScannerEngine = MlKitBarcodeScannerEngine(ScannerConfig())
    private lateinit var cameraExecutor: ExecutorService

    private var hasCameraPermission by mutableStateOf(false)

    private val requestCameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        cameraExecutor = Executors.newSingleThreadExecutor()

        hasCameraPermission = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA,
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasCameraPermission) {
            requestCameraPermission.launch(Manifest.permission.CAMERA)
        }

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (hasCameraPermission) {
                        ScannerScreen(scannerEngine = scannerEngine, cameraExecutor = cameraExecutor)
                    } else {
                        PermissionRationale()
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scannerEngine.close()
        cameraExecutor.shutdown()
    }
}

@Composable
private fun ScannerScreen(
    scannerEngine: BarcodeScannerEngine,
    cameraExecutor: ExecutorService,
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    var lastResult by remember { mutableStateOf<BarcodeScanResult?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                val previewView = PreviewView(context)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { analysis ->
                            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                scannerEngine.processFrame(
                                    imageProxy = imageProxy,
                                    onResult = { result -> lastResult = result },
                                    onError = { /* transient decode failure; next frame retries */ },
                                )
                            }
                        }

                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis,
                    )
                }, ContextCompat.getMainExecutor(context))

                previewView
            },
        )

        lastResult?.let { result ->
            ScanResultCard(
                result = result,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 64.dp, start = 20.dp, end = 20.dp),
            )
        }
    }
}

/**
 * Result pill shown after a successful scan. Anchored to the lower third of
 * the screen (well above the bottom edge / system nav) so it never overlaps
 * the center of the preview where the barcode itself is being held.
 */
@Composable
private fun ScanResultCard(result: BarcodeScanResult, modifier: Modifier = Modifier) {
    val successColor = Color(0xFF43A047)

    // Brief highlight flash on every new scan, driven by result identity so it
    // re-triggers even when the same barcode is scanned again after cooldown.
    val flash = remember { Animatable(1f) }
    LaunchedEffect(result.timestamp, result.value) {
        flash.snapTo(1f)
        flash.animateTo(0f, animationSpec = tween(durationMillis = 900))
    }
    val borderAlpha = 0.3f + 0.7f * flash.value

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xE60E1410)),
        border = BorderStroke(2.dp, successColor.copy(alpha = borderAlpha)),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "✓ SCANNED",
                color = successColor,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.5.sp,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Barcode: ${result.value}",
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Format: ${result.format.name.replace('_', '-')}",
                color = Color(0xFFB0BEC5),
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun PermissionRationale() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Camera permission is required to scan barcodes.")
    }
}
