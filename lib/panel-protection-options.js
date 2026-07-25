/** Stable keys + UI labels for admin Security toggles (client-safe). */
export const PROTECTION_OPTIONS = [
  { id: "anti_debugger_detection", label: "Anti-Debugger Detection" },
  { id: "advanced_api_wrapping", label: "Advanced API-Wrapping" },
  { id: "encrypt_strings_vm_ansi", label: "Encrypt Strings in VM macros (ANSI strings)" },
  { id: "encrypt_strings_vm_unicode", label: "Encrypt Strings in VM macros (UNICODE strings)" },
  { id: "compress_encrypt_application", label: "Compress And Encrypt Application" },
  { id: "compress_encrypt_resources", label: "Compress And Encrypt Resources" },
  { id: "compress_encrypt_source_engine", label: "Compress And Encrypt SourceEngine" },
  { id: "detect_file_registry_monitors", label: "Detect File/Registry Monitors" },
  { id: "entry_point_virtualization", label: "Entry Point Virtualization" },
  { id: "anti_file_patching", label: "Anti-File patching" },
  { id: "anti_sandbox", label: "Anti-Sandbox" },
  { id: "protection_checks_vm_macros", label: "Perform Protections checks on VM macros" },
  { id: "allow_vmware_virtual_pc", label: "Allow execution under VMware/Virtual PC" },
];

export function defaultProtectionFlags() {
  return Object.fromEntries(PROTECTION_OPTIONS.map((item) => [item.id, false]));
}
