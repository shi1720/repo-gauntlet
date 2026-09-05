use std::collections::{BTreeMap, BTreeSet};
#[derive(Debug, PartialEq, Eq)] pub enum PlanError { Cycle(Vec<String>) }
pub fn plan(graph: &BTreeMap<String, Vec<String>>) -> Result<Vec<String>, PlanError> {
    fn visit(node:&str, graph:&BTreeMap<String,Vec<String>>, stack:&mut Vec<String>, done:&mut BTreeSet<String>, out:&mut Vec<String>)->Result<(),PlanError>{
        if let Some(index)=stack.iter().position(|item|item==node){let mut cycle=stack[index..].to_vec();cycle.push(node.to_string());return Err(PlanError::Cycle(cycle));}
        if stack.len() > 1024 { return Err(PlanError::Cycle(vec![node.to_string()])); }
        if done.contains(node){return Ok(());} stack.push(node.to_string()); let mut deps=graph.get(node).cloned().unwrap_or_default();deps.sort();
        for dep in deps{visit(&dep,graph,stack,done,out)?;} stack.pop();done.insert(node.to_string());out.push(node.to_string());Ok(())
    }
    let mut out=Vec::new();let mut stack=Vec::new();let mut done=BTreeSet::new();for node in graph.keys(){visit(node,graph,&mut stack,&mut done,&mut out)?;}Ok(out)
}
