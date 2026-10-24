import Foundation
import AVFoundation
let asset = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let tracks = try await asset.loadTracks(withMediaType: .video)
if let track = tracks.first {
 let size = try await track.load(.naturalSize)
 let transform = try await track.load(.preferredTransform)
 let oriented = CGSize(width: size.width, height: size.height).applying(transform)
 let duration = try await asset.load(.duration)
 let fps = try await track.load(.nominalFrameRate)
 let data = try JSONSerialization.data(withJSONObject: ["width": abs(oriented.width), "height": abs(oriented.height), "duration": CMTimeGetSeconds(duration), "fps": fps])
 print(String(data:data,encoding:.utf8)!)
}
