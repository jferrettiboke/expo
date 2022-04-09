// Copyright 2022-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#ifdef __cplusplus
#import <jsi/jsi.h>
#import <ReactCommon/CallInvoker.h>

namespace jsi = facebook::jsi;
#endif // __cplusplus

@class EXJavaScriptRuntime;
@class EXJavaScriptValue;

typedef void (^JSAsyncFunctionBlock)(NSArray<EXJavaScriptValue *> * _Nonnull, RCTPromiseResolveBlock _Nonnull, RCTPromiseRejectBlock _Nonnull);
typedef id _Nullable (^JSSyncFunctionBlock)(NSArray<EXJavaScriptValue *> * _Nonnull);

/**
 The property descriptor options for the property being defined or modified.
 */
typedef NS_OPTIONS(NSInteger, EXJavaScriptObjectPropertyDescriptor) {
  /**
   The default property descriptor.
   */
  EXJavaScriptObjectPropertyDescriptorDefault = 0,
  /**
   If set, the type of this property descriptor may be changed and if the property may be deleted from the corresponding object.
   */
  EXJavaScriptObjectPropertyDescriptorConfigurable = 1 << 0,
  /**
   If set, the property shows up during enumeration of the properties on the corresponding object.
   */
  EXJavaScriptObjectPropertyDescriptorEnumerable = 1 << 1,
  /**
   If set, the value associated with the property may be changed with an assignment operator.
   */
  EXJavaScriptObjectPropertyDescriptorWritable = 1 << 2,
} NS_SWIFT_NAME(JavaScriptObjectProperty);

NS_SWIFT_NAME(JavaScriptObject)
@interface EXJavaScriptObject : NSObject

// Some parts of the interface must be hidden for Swift – it can't import any C++ code.
#ifdef __cplusplus
- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull EXJavaScriptRuntime *)runtime;

/**
 Returns the pointer to the underlying object.
 */
- (nonnull jsi::Object *)get;
#endif // __cplusplus

#pragma mark - Accessing object properties

- (BOOL)hasProperty:(nonnull NSString *)name;

- (nonnull EXJavaScriptValue *)getProperty:(nonnull NSString *)name;

#pragma mark - Modifying object properties

- (void)setProperty:(nonnull NSString *)name value:(nullable id)value;

- (void)defineProperty:(nonnull NSString *)name value:(nullable id)value options:(EXJavaScriptObjectPropertyDescriptor)options;

- (void)setDeallocator;

#pragma mark - Subscripting

/**
 Subscript getter. Supports only values convertible to Foundation types, otherwise `nil` is returned.
 */
- (nullable id)objectForKeyedSubscript:(nonnull NSString *)key;

/**
 Subscript setter. Only `EXJavaScriptObject` and Foundation object convertible to JSI values can be used as a value,
 otherwise the property is set to `undefined`.
 */
- (void)setObject:(nullable id)obj forKeyedSubscript:(nonnull NSString *)key;

#pragma mark - Functions

/**
 Sets given function block on the object as a host function returning a promise.
 */
- (void)setAsyncFunction:(nonnull NSString *)key
               argsCount:(NSInteger)argsCount
                   block:(nonnull JSAsyncFunctionBlock)block;

/**
 Sets given synchronous function block as a host function on the object.
 */
- (void)setSyncFunction:(nonnull NSString *)name
              argsCount:(NSInteger)argsCount
                  block:(nonnull JSSyncFunctionBlock)block;

@end
