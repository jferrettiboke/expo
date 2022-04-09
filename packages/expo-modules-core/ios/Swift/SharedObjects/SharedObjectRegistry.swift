// Copyright 2022-present 650 Industries. All rights reserved.

public final class SharedObjectRegistry {
  // MARK: - Type aliases

  internal typealias SharedObjectId = Int
  internal typealias SharedObjectPair = (native: SharedObject, javaScript: JavaScriptObject)

  // MARK: - Statics

  private static var nextId: SharedObjectId = 1

  internal static func increment() -> SharedObjectId {
    let id = nextId
    nextId += 1
    return id
  }

  // MARK: - Non-statics

  private static var pairs = [SharedObjectId: SharedObjectPair]()

  internal static func get(_ id: SharedObjectId) -> SharedObjectPair? {
    return pairs[id]
  }

  @discardableResult
  internal static func put(_ pair: SharedObjectPair) -> SharedObjectId {
    let id = Self.increment()
    pairs[id] = pair
    return id
  }
}
