// Copyright 2022-present 650 Industries. All rights reserved.

internal struct SharedObjectArgumentType: AnyArgumentType {
  let innerType: SharedObject.Type

  func cast<ArgType>(_ value: ArgType) throws -> Any {
//    return try innerType.create(fromRawValue: value)
  }
}
