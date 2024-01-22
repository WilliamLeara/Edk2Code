import * as vscode from 'vscode';
import { CallHierarchyItem, SemanticTokens, SymbolKind } from 'vscode';
import { gCscope } from './extension';
export class Edk2CallHierarchyProvider implements vscode.CallHierarchyProvider {
    
    constructor(){
        vscode.languages.registerCallHierarchyProvider(
            {
                scheme: 'file',
                language: 'c'
            },
            this
        );
    }

    prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CallHierarchyItem | vscode.CallHierarchyItem[]> {
        const range = document.getWordRangeAtPosition(position);
        if(!range){return[];}
        const word = document.getText(range);
        return new CallHierarchyItem(SymbolKind.Method, word, "", document.uri, range, range);
    }

    async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken) {
        
        let allLocations:any[] = await gCscope.getCaller(item.name);
        
        // Filter results to only show files used in compilation
        let filteredLocations:vscode.CallHierarchyIncomingCall[] = [];
        for (const result of allLocations) {
            let fileUri = vscode.Uri.file(result.file);
            if(!gCscope.includesFile(fileUri)){continue;}
            let namePosition = result.snipped.indexOf(item.name);
            let pos = new vscode.Position(result.line, namePosition);
            let currentRange = new vscode.Range(pos, pos);
            let caller = new CallHierarchyItem(
                SymbolKind.Function,
                result.name,
                `${result.file}: ${result.line + 1}`,
                fileUri,
                currentRange,
                currentRange
             );
            filteredLocations.push(
                new vscode.CallHierarchyIncomingCall(
                    caller,
                    [currentRange]
                    )
                );
        }
        return filteredLocations;
    }

    async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken){
        let allLocations:any[] = await gCscope.getCallee(item.name);
        
        // Filter results to only show files used in compilation
        let filteredLocations:vscode.CallHierarchyOutgoingCall[] = [];
        for (const result of allLocations) {
            let namePosition = result.snipped.indexOf(result.name);
            let pos = new vscode.Position(result.line, namePosition);
            let currentRange = new vscode.Range(pos, pos);
            let caller = new CallHierarchyItem(
                SymbolKind.Function,
                result.name,
                `${result.file}: ${result.line}`,
                vscode.Uri.file(result.file),
                currentRange,
                currentRange
             );
            filteredLocations.push(
                new vscode.CallHierarchyOutgoingCall(
                    caller,
                    [currentRange]
                    )
                );
        }
        return filteredLocations;
    }


 }