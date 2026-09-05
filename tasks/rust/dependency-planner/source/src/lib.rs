use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, PartialEq, Eq)]
pub enum PlanError { Cycle(Vec<String>) }

pub fn plan(graph: &BTreeMap<String, Vec<String>>) -> Result<Vec<String>, PlanError> {
    fn visit(node: &str, graph: &BTreeMap<String, Vec<String>>, active: &mut BTreeSet<String>, done: &mut BTreeSet<String>, out: &mut Vec<String>) -> Result<(), PlanError> {
        if active.contains(node) { return Err(PlanError::Cycle(vec![node.to_string()])); }
        if done.contains(node) { return Ok(()); }
        active.insert(node.to_string());
        let mut deps = graph.get(node).cloned().unwrap_or_default();
        deps.sort();
        for dep in deps { visit(&dep, graph, active, done, out)?; }
        active.remove(node); done.insert(node.to_string()); out.push(node.to_string()); Ok(())
    }
    let mut out = Vec::new(); let mut active = BTreeSet::new(); let mut done = BTreeSet::new();
    for node in graph.keys() { visit(node, graph, &mut active, &mut done, &mut out)?; }
    Ok(out)
}

