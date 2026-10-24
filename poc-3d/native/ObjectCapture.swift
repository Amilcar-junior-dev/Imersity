import Foundation
import RealityKit
import Metal

func emit(_ value: [String: Any]) {
    if let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]) {
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data([10]))
    }
}

@main struct ImersityObjectCapture {
    static func main() async {
        if CommandLine.arguments.contains("--check") {
            emit(["supported": PhotogrammetrySession.isSupported, "metalDevice": MTLCreateSystemDefaultDevice()?.name ?? "unavailable", "maxImages": PhotogrammetrySession.limits.maximumNumberOfInputImages, "maxDimension": PhotogrammetrySession.limits.maximumInputImageDimension])
            return
        }
        let args = CommandLine.arguments
        guard (4...5).contains(args.count), ["preview", "reduced", "medium", "full", "custom", "head-custom"].contains(args[3]) else {
            emit(["event": "error", "message": "Uso: imersity-object-capture INPUT OUTPUT.usdz preview|reduced|medium|full|custom|head-custom [baseCut]"])
            exit(2)
        }
        let headOnly = args[3] == "head-custom"
        let baseCut = args.count == 5 ? (Float(args[4]) ?? .nan) : 0.30
        guard baseCut.isFinite, (0...0.70).contains(baseCut), args.count == 4 || headOnly else {
            emit(["event": "error", "message": "Recorte inválido: use uma fração entre 0 e 0,70 apenas em head-custom."])
            exit(2)
        }
        guard PhotogrammetrySession.isSupported else {
            emit(["event": "error", "message": "Object Capture indisponível neste Mac."])
            exit(3)
        }
        do {
            var configuration = PhotogrammetrySession.Configuration()
            configuration.sampleOrdering = .sequential
            configuration.featureSensitivity = .high
            configuration.isObjectMaskingEnabled = false
            let custom = args[3] == "custom" || headOnly
            if custom {
                var specification = PhotogrammetrySession.Configuration.CustomDetailSpecification()
                specification.maximumPolygonCount = 500_000
                specification.maximumTextureDimension = .eightK
                specification.outputTextureMaps = [.diffuseColor, .normal, .roughness, .ambientOcclusion]
                specification.textureFormat = .png
                configuration.customDetailSpecification = specification
            }
            let detail: PhotogrammetrySession.Request.Detail = custom ? .custom : ["preview": .preview, "reduced": .reduced, "medium": .medium, "full": .full][args[3]]!
            let session = try PhotogrammetrySession(input: URL(fileURLWithPath: args[1]), configuration: configuration)
            let output = URL(fileURLWithPath: args[2])
            emit(["event": "configuration", "profile": args[3], "maximumPolygonCount": custom ? 500_000 : 0, "baseCut": headOnly ? baseCut : 0, "cropAxis": "Y", "metricValidated": false])
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
