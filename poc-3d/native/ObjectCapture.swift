import Foundation
import RealityKit
import Metal
import Vision
import CoreImage
import CoreVideo

func emit(_ value: [String: Any]) {
    if let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]) {
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data([10]))
    }
}

// Explicit per-photo masks. No RGB painting or generated geometry is used.
func personMask(_ image: CVPixelBuffer, context: CIContext, output: URL) throws -> CVPixelBuffer {
    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = .accurate
    request.outputPixelFormat = kCVPixelFormatType_OneComponent8
    try VNImageRequestHandler(cvPixelBuffer: image, orientation: .up).perform([request])
    guard let observation = request.results?.first else {
        throw NSError(domain: "Imersity", code: 10, userInfo: [NSLocalizedDescriptionKey: "Não foi possível segmentar a pessoa na foto."])
    }
    let width = CVPixelBufferGetWidth(image), height = CVPixelBufferGetHeight(image)
    let raw = observation.pixelBuffer
    var resized: CVPixelBuffer?
    let status = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_OneComponent8,
                                    [kCVPixelBufferIOSurfacePropertiesKey: [:]] as CFDictionary, &resized)
    guard status == kCVReturnSuccess, let mask = resized else {
        throw NSError(domain: "Imersity", code: 11, userInfo: [NSLocalizedDescriptionKey: "Falha ao criar a máscara."])
    }
    let bounds = CGRect(x: 0, y: 0, width: width, height: height)
    let scaled = CIImage(cvPixelBuffer: raw).transformed(by: .init(scaleX: CGFloat(width)/CGFloat(CVPixelBufferGetWidth(raw)), y: CGFloat(height)/CGFloat(CVPixelBufferGetHeight(raw))))
    // Conservative edge margin and threshold preserve hair rather than erasing it.
    let expanded = scaled.applyingFilter("CIMorphologyMaximum", parameters: [kCIInputRadiusKey: 6]).cropped(to: bounds)
    context.render(expanded, to: mask, bounds: bounds, colorSpace: CGColorSpaceCreateDeviceGray())
    CVPixelBufferLockBaseAddress(mask, [])
    let stride = CVPixelBufferGetBytesPerRow(mask)
    let pixels = CVPixelBufferGetBaseAddress(mask)!.assumingMemoryBound(to: UInt8.self)
    var foreground = 0
    for y in 0..<height {
        for x in 0..<width {
            let keep = pixels[y*stride+x] >= 32
            pixels[y*stride+x] = keep ? 255 : 0
            if keep { foreground += 1 }
        }
    }
    CVPixelBufferUnlockBaseAddress(mask, [])
    let fraction = Double(foreground)/Double(width*height)
    try context.writePNGRepresentation(of: CIImage(cvPixelBuffer: mask), to: output, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())
    emit(["event": "maskCoverage", "file": output.lastPathComponent, "foregroundFraction": fraction])
    guard fraction > 0.02 else {
        throw NSError(domain: "Imersity", code: 12, userInfo: [NSLocalizedDescriptionKey: "Máscara quase vazia; requer revisão."])
    }
    // A close view can legitimately fill the frame. Save and flag it for review
    // rather than silently replacing the provided mask with automatic masking.
    if fraction >= 0.98 {
        emit(["event": "warning", "message": "Máscara ocupa quase toda a foto: \(output.lastPathComponent). Conferir enquadramento e segmentação."])
    }
    return mask
}

@main struct ImersityObjectCapture {
    static func main() async {
        if CommandLine.arguments.contains("--check") {
            emit(["supported": PhotogrammetrySession.isSupported, "metalDevice": MTLCreateSystemDefaultDevice()?.name ?? "unavailable", "maxImages": PhotogrammetrySession.limits.maximumNumberOfInputImages, "maxDimension": PhotogrammetrySession.limits.maximumInputImageDimension])
            return
        }
        let args = CommandLine.arguments
        guard (4...5).contains(args.count), ["preview", "reduced", "medium", "full", "custom", "head-custom", "recovery", "person-recovery", "person-head"].contains(args[3]) else {
            emit(["event": "error", "message": "Uso: imersity-object-capture INPUT OUTPUT.usdz preview|reduced|medium|full|custom|head-custom|recovery|person-recovery|person-head [baseCut]"])
            exit(2)
        }
        let headOnly = args[3] == "head-custom" || args[3] == "person-head"
        let baseCut = args.count == 5 ? (Float(args[4]) ?? .nan) : 0.30
        guard baseCut.isFinite, (0...0.70).contains(baseCut), args.count == 4 || headOnly else {
            emit(["event": "error", "message": "Recorte inválido: use uma fração entre 0 e 0,70 apenas em head-custom/person-head."])
            exit(2)
        }
        guard PhotogrammetrySession.isSupported else {
            emit(["event": "error", "message": "Object Capture indisponível neste Mac."])
            exit(3)
        }
        do {
            // A separate experiment: keep Medium output to compare alignment,
            // enabling foreground masks and unrestricted sample matching.
            let explicitMasks = args[3] == "person-recovery" || args[3] == "person-head"
            let recovery = args[3] == "recovery" || explicitMasks
            var configuration = PhotogrammetrySession.Configuration()
            configuration.sampleOrdering = recovery ? .unordered : .sequential
            configuration.featureSensitivity = .high
            configuration.isObjectMaskingEnabled = recovery
            let custom = args[3] == "custom" || headOnly
            if custom {
                var specification = PhotogrammetrySession.Configuration.CustomDetailSpecification()
                specification.maximumPolygonCount = 500_000
                // Keep 4K for the neck geometry experiment, matching Medium's
                // observed texture size so a larger atlas cannot hide a bad mesh.
                specification.maximumTextureDimension = args[3] == "person-head" ? .fourK : .eightK
                specification.outputTextureMaps = [.diffuseColor, .normal, .roughness, .ambientOcclusion]
                specification.textureFormat = .png
                configuration.customDetailSpecification = specification
            }
            let detail: PhotogrammetrySession.Request.Detail = custom ? .custom : ["preview": .preview, "reduced": .reduced, "medium": .medium, "full": .full, "recovery": .medium, "person-recovery": .medium][args[3]]!
            let session: PhotogrammetrySession
            if explicitMasks {
                let maskFolder = URL(fileURLWithPath: args[2]).deletingLastPathComponent().appendingPathComponent("person-masks")
                try FileManager.default.createDirectory(at: maskFolder, withIntermediateDirectories: true)
                let urls = try FileManager.default.contentsOfDirectory(at: URL(fileURLWithPath: args[1]), includingPropertiesForKeys: nil).filter { ["jpg", "jpeg", "png", "heic"].contains($0.pathExtension.lowercased()) }.sorted { $0.lastPathComponent < $1.lastPathComponent }
                let context = CIContext()
                var samples: [PhotogrammetrySample] = []
                emit(["event": "stage", "stage": "personSegmentation"])
                for (index, url) in urls.enumerated() {
                    let sample: PhotogrammetrySample = try autoreleasepool {
                        var sample = try PhotogrammetrySample(contentsOf: url)
                        sample.objectMask = try personMask(sample.image, context: context, output: maskFolder.appendingPathComponent(url.deletingPathExtension().lastPathComponent+".png"))
                        return sample
                    }
                    samples.append(sample)
                    emit(["event": "personMask", "sampleID": sample.id, "file": url.lastPathComponent, "completed": index+1, "total": urls.count])
                }
                session = try PhotogrammetrySession(input: samples, configuration: configuration)
            } else {
                session = try PhotogrammetrySession(input: URL(fileURLWithPath: args[1]), configuration: configuration)
            }
            let output = URL(fileURLWithPath: args[2])
            emit(["event": "configuration", "profile": args[3], "maximumPolygonCount": custom ? 500_000 : 0, "baseCut": headOnly ? baseCut : 0, "cropAxis": "Y", "metricValidated": false, "objectMasking": configuration.isObjectMaskingEnabled, "explicitPersonMasks": explicitMasks, "sampleOrdering": recovery ? "unordered" : "sequential", "featureSensitivity": "high", "outputDetail": custom ? "custom" : (recovery ? "medium" : args[3])])
            // Bounds and reconstruction share this session's coordinate system.
            // No normalized GLB coordinates or guessed metric dimensions are reused.
            var waitingForBounds = headOnly
            var captureBounds: BoundingBox?
            try session.process(requests: headOnly ? [.bounds] : [.modelFile(url: output, detail: detail)])
            var completed = false
            for try await event in session.outputs {
                switch event {
                case .inputComplete: emit(["event": "stage", "stage": "inputComplete"])
                case .requestProgress(_, let fraction): emit(["event": "progress", "fraction": fraction])
                case .requestProgressInfo(_, let info):
                    var data: [String: Any] = ["event": "stage"]
                    if let stage = info.processingStage { data["stage"] = String(describing: stage) }
                    if let eta = info.estimatedRemainingTime { data["estimatedRemainingSeconds"] = eta }
                    emit(data)
                case .requestComplete(_, let result):
                    if case .modelFile = result { completed = true; emit(["event": "modelComplete"]) }
                    if case .bounds(let bounds) = result { captureBounds = bounds }
                case .invalidSample(let id, let reason): emit(["event": "warning", "message": "Imagem \(id) inválida: \(reason)"])
                case .skippedSample(let id): emit(["event": "warning", "message": "Imagem \(id) ignorada pelo reconstrutor."])
                case .automaticDownsampling: emit(["event": "warning", "message": "O sistema reduziu automaticamente a resolução das imagens."])
                case .stitchingIncomplete: emit(["event": "warning", "message": "Alinhamento incompleto: partes da captura podem estar ausentes."])
                case .requestError(_, let error): throw error
                case .processingCancelled: emit(["event": "error", "message": "Reconstrução cancelada."]); exit(4)
                case .processingComplete:
                    if waitingForBounds {
                        guard var bounds = captureBounds, bounds.max.y > bounds.min.y else {
                            throw NSError(domain: "Imersity", code: 3, userInfo: [NSLocalizedDescriptionKey: "Não foi possível determinar o volume da captura."])
                        }
                        waitingForBounds = false
                        bounds.min.y += (bounds.max.y - bounds.min.y) * baseCut
                        emit(["event": "crop", "min": [bounds.min.x, bounds.min.y, bounds.min.z], "max": [bounds.max.x, bounds.max.y, bounds.max.z], "baseCut": baseCut, "automaticHeadDetection": false])
                        emit(["event": "stage", "stage": "headReconstruction"])
                        try session.process(requests: [.modelFile(url: output, detail: detail, geometry: .init(bounds: bounds))])
                        continue
                    }
                    guard completed, FileManager.default.fileExists(atPath: output.path) else { throw NSError(domain: "Imersity", code: 1, userInfo: [NSLocalizedDescriptionKey: "Nenhum modelo foi gerado."]) }
                    emit(["event": "complete"])
                    return
                @unknown default: break
                }
            }
            if !completed { throw NSError(domain: "Imersity", code: 2, userInfo: [NSLocalizedDescriptionKey: "Reconstrução encerrada sem modelo."]) }
        } catch {
            emit(["event": "error", "message": error.localizedDescription])
            exit(1)
        }
    }
}
