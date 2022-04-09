// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/EXObjectDeallocator.h>

@implementation EXJavaScriptObject {
  /**
   Pointer to the `EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the original JSI object that is being wrapped by `EXJavaScriptObject` class.
   */
  std::shared_ptr<jsi::Object> _jsObjectPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;
    _jsObjectPtr = jsObjectPtr;
  }
  return self;
}

- (nonnull jsi::Object *)get
{
  return _jsObjectPtr.get();
}

#pragma mark - Accessing object properties

- (BOOL)hasProperty:(nonnull NSString *)name
{
  return _jsObjectPtr->hasProperty(*[_runtime get], [name UTF8String]);
}

- (nonnull EXJavaScriptValue *)getProperty:(nonnull NSString *)name
{
  std::shared_ptr<jsi::Value> value = std::make_shared<jsi::Value>(_jsObjectPtr->getProperty(*[_runtime get], [name UTF8String]));
  return [[EXJavaScriptValue alloc] initWithRuntime:_runtime value:value];
}

#pragma mark - Modifying object properties

- (void)setProperty:(nonnull NSString *)name value:(nullable id)value
{
  jsi::Value jsiValue = expo::convertObjCObjectToJSIValue(*[_runtime get], value);
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], jsiValue);
}

- (void)defineProperty:(nonnull NSString *)name value:(nullable id)value options:(EXJavaScriptObjectPropertyDescriptor)options
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object global = runtime->global();
  jsi::Object objectClass = global.getPropertyAsObject(*runtime, "Object");
  jsi::Function definePropertyFunction = objectClass.getPropertyAsFunction(*runtime, "defineProperty");
  jsi::Object descriptor = [self preparePropertyDescriptorWithOptions:options];

  descriptor.setProperty(*runtime, "value", expo::convertObjCObjectToJSIValue(*runtime, value));

  // Object.defineProperty(object, name, descriptor)
  definePropertyFunction.callWithThis(*runtime, objectClass, {
    jsi::Value(*runtime, *_jsObjectPtr.get()),
    jsi::String::createFromUtf8(*runtime, [name UTF8String]),
    std::move(descriptor),
  });
}

- (void)setDeallocator
{
  jsi::Runtime *runtime = [_runtime get];
  expo::ObjectDeallocator deallocator = expo::ObjectDeallocator(^{

  });
  jsi::Value value(*runtime, jsi::Object::createFromHostObject(*runtime, std::make_shared<jsi::HostObject>(deallocator)));

  [self defineProperty:@"__deallocator__"
                 value:[[EXJavaScriptValue alloc] initWithRuntime:_runtime value:std::make_shared<jsi::Value>(*runtime, value)]
               options:0];
}

#pragma mark - Subscripting

- (nullable id)objectForKeyedSubscript:(nonnull NSString *)key
{
  auto runtime = [_runtime get];
  auto callInvoker = [_runtime callInvoker];

  if (runtime && callInvoker) {
    auto value = _jsObjectPtr->getProperty(*runtime, [key UTF8String]);
    return expo::convertJSIValueToObjCObject(*runtime, value, callInvoker);
  }
  return nil;
}

- (void)setObject:(nullable id)obj forKeyedSubscript:(nonnull NSString *)key
{
  auto runtime = [_runtime get];

  if (!runtime) {
    NSLog(@"Cannot set '%@' property when the EXJavaScript runtime is no longer available.", key);
    return;
  }
  jsi::Value value = expo::convertObjCObjectToJSIValue(*runtime, obj);
  _jsObjectPtr->setProperty(*runtime, [key UTF8String], value);
}

#pragma mark - Functions

- (void)setAsyncFunction:(nonnull NSString *)name
               argsCount:(NSInteger)argsCount
                   block:(nonnull JSAsyncFunctionBlock)block
{
  if (!_runtime) {
    NSLog(@"Cannot set '%@' async function when the EXJavaScript runtime is no longer available.", name);
    return;
  }
  jsi::Function function = [_runtime createAsyncFunction:name argsCount:argsCount block:block];
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], function);
}

- (void)setSyncFunction:(nonnull NSString *)name
              argsCount:(NSInteger)argsCount
                  block:(nonnull JSSyncFunctionBlock)block
{
  if (!_runtime) {
    NSLog(@"Cannot set '%@' sync function when the EXJavaScript runtime is no longer available.", name);
    return;
  }
  jsi::Function function = [_runtime createSyncFunction:name argsCount:argsCount block:block];
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], function);
}

#pragma mark - Private helpers

- (jsi::Object)preparePropertyDescriptorWithOptions:(EXJavaScriptObjectPropertyDescriptor)options
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object descriptor(*runtime);
  descriptor.setProperty(*runtime, "configurable", (bool)(options & EXJavaScriptObjectPropertyDescriptorConfigurable));
  descriptor.setProperty(*runtime, "enumerable", (bool)(options & EXJavaScriptObjectPropertyDescriptorEnumerable));
  descriptor.setProperty(*runtime, "writable", (bool)(options & EXJavaScriptObjectPropertyDescriptorWritable));
  return descriptor;
}

@end
