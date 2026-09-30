using System;
using System.IO;
using System.Collections.Generic;
using Mono.Cecil;
using Mono.Cecil.Cil;
using Mono.Cecil.Rocks;

// BepInEx preloader: modifies assemblies in memory, never the installed game DLLs.
public static class QuizIsolation
{
    public static IEnumerable<string> TargetDLLs { get { return new[] { "Assembly-CSharp.dll", "Assembly-CSharp-firstpass.dll" }; } }
    static IEnumerable<TypeDefinition> AllTypes(IEnumerable<TypeDefinition> types)
    {
        foreach (var t in types) { yield return t; foreach (var n in AllTypes(t.NestedTypes)) yield return n; }
    }
    public static void Patch(AssemblyDefinition assembly)
    {
        string root = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "saves", "peglin"));
        Directory.CreateDirectory(root);
        int paths = 0, prefs = 0;
        var module = assembly.MainModule;
        var concat = module.ImportReference(typeof(string).GetMethod("Concat", new[] { typeof(string), typeof(string) }));
        foreach (var type in AllTypes(module.Types)) foreach (var method in type.Methods)
        {
            if (!method.HasBody) continue;
            method.Body.SimplifyMacros();
            var ops = new List<Instruction>(method.Body.Instructions);
            foreach (var op in ops)
            {
                var call = op.Operand as MethodReference;
                if (call == null || (op.OpCode != OpCodes.Call && op.OpCode != OpCodes.Callvirt)) continue;
                if (call.DeclaringType.FullName == "UnityEngine.Application" && call.Name == "get_persistentDataPath")
                { op.OpCode = OpCodes.Ldstr; op.Operand = root; paths++; }
                else if (call.DeclaringType.FullName == "UnityEngine.PlayerPrefs" && call.Parameters.Count > 0 && call.Parameters[0].ParameterType.FullName == "System.String")
                {
                    var locals = new List<VariableDefinition>();
                    foreach (var p in call.Parameters) { var v = new VariableDefinition(module.ImportReference(p.ParameterType)); method.Body.Variables.Add(v); locals.Add(v); }
                    method.Body.InitLocals = true;
                    var inserted = new List<Instruction>();
                    for (int i = locals.Count - 1; i >= 0; i--) inserted.Add(Instruction.Create(OpCodes.Stloc, locals[i]));
                    inserted.Add(Instruction.Create(OpCodes.Ldstr, "peglin_quiz_"));
                    inserted.Add(Instruction.Create(OpCodes.Ldloc, locals[0]));
                    inserted.Add(Instruction.Create(OpCodes.Call, concat));
                    for (int i = 1; i < locals.Count; i++) inserted.Add(Instruction.Create(OpCodes.Ldloc, locals[i]));
                    inserted.Add(Instruction.Create(OpCodes.Call, call));
                    op.OpCode = inserted[0].OpCode; op.Operand = inserted[0].Operand;
                    var il = method.Body.GetILProcessor(); var previous = op;
                    for (int i = 1; i < inserted.Count; i++) { il.InsertAfter(previous, inserted[i]); previous = inserted[i]; }
                    prefs++;
                }
            }
            method.Body.OptimizeMacros();
        }
        File.AppendAllText(Path.Combine(root, "isolation.log"), assembly.Name.Name + " paths=" + paths + " prefs=" + prefs + " root=" + root + Environment.NewLine);
    }
}
