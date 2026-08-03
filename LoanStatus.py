from tkinter import *
import tkinter
from tkinter import filedialog
import numpy as np
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import pandas as pd
import pickle
import shap

main = tkinter.Tk()
main.title("EDA - BANK LOAN DEFAULT RISK ANALYSIS")
main.geometry("1000x650")

# Global Variables
global dataset, loan_status, loan_reject_reason, scaler, label_encoder, cols
global loan_X_train, loan_X_test, loan_y_train, loan_y_test
global reject_X_train, reject_X_test, reject_y_train, reject_y_test
global rf, reject_rf, status_names, reject_names

rf = None # Initialize as None to prevent Explain AI errors

def loadDataset():
    global dataset, loan_status, loan_reject_reason, status_names, reject_names
    filename = filedialog.askopenfilename()
    if filename:
        text.delete('1.0', END)
        dataset = pd.read_csv(filename, nrows=20000)
        text.insert(END, "Dataset Loaded\n\n")
        text.insert(END, str(dataset.head()))

        loan_status = dataset['NAME_CONTRACT_STATUS']
        loan_reject_reason = dataset['CODE_REJECT_REASON']

        status_names, status_count = np.unique(loan_status, return_counts=True)
        plt.figure(figsize=(10, 5))
        sns.barplot(x=status_names, y=status_count)
        plt.title("Loan Status Distribution")
        plt.show()

def processDataset():
    global dataset, scaler, X, loan_status, loan_reject_reason
    text.delete('1.0', END)
    text.insert(END, "Processing dataset...\n")

    try:
        dataset_copy = dataset.copy()

        if 'NAME_CONTRACT_STATUS' not in dataset_copy.columns:
            text.insert(END, "Error: NAME_CONTRACT_STATUS not found\n")
            return

        loan_status = dataset_copy['NAME_CONTRACT_STATUS']
        loan_reject_reason = dataset_copy['CODE_REJECT_REASON']
        dataset_copy = dataset_copy.drop(['NAME_CONTRACT_STATUS', 'CODE_REJECT_REASON'], axis=1)

        # STEP 1: Handle missing values (Correct Indentation)
        for col in dataset_copy.columns:
            if dataset_copy[col].dtype == 'object':
                dataset_copy[col] = dataset_copy[col].fillna("missing")
            else:
                dataset_copy[col] = dataset_copy[col].fillna(0)

        # STEP 2: Encode (Correct Indentation)
        for col in dataset_copy.columns:
            if dataset_copy[col].dtype == 'object':
                dataset_copy[col] = LabelEncoder().fit_transform(dataset_copy[col].astype(str))

        # STEP 3: Final Safety
        dataset_copy = dataset_copy.apply(pd.to_numeric, errors='coerce')
        dataset_copy.fillna(0, inplace=True)
        
        X = dataset_copy.values
        scaler = StandardScaler()
        X = scaler.fit_transform(X)

        text.insert(END, "Dataset processed successfully!\n")

    except Exception as e:
        text.insert(END, f"Error: {str(e)}\n")

def splitDataset():
    global X, loan_status, loan_reject_reason
    global loan_X_train, loan_X_test, loan_y_train, loan_y_test
    global reject_X_train, reject_X_test, reject_y_train, reject_y_test

    text.delete('1.0', END)
    text.insert(END, "Splitting dataset...\n")
    try:
        loan_X_train, loan_X_test, loan_y_train, loan_y_test = train_test_split(X, loan_status, test_size=0.2)
        reject_X_train, reject_X_test, reject_y_train, reject_y_test = train_test_split(X, loan_reject_reason, test_size=0.2)
        text.insert(END, "Dataset split successfully!\n")
    except Exception as e:
        text.insert(END, f"Error: {str(e)}\n")

def aiApproval():
    global rf
    text.delete('1.0', END)
    text.insert(END, "Training Loan Model...\n")
    try:
        rf = RandomForestClassifier(n_estimators=100)
        rf.fit(loan_X_train, loan_y_train)
        pickle.dump(rf, open("loan_model.pkl", "wb"))
        text.insert(END, "Loan Model Trained & Saved!\n")
    except Exception as e:
        text.insert(END, f"Error: {str(e)}\n")

def aiReject():
    global reject_rf
    text.delete('1.0', END)
    text.insert(END, "Training Reject Model...\n")
    try:
        reject_rf = RandomForestClassifier(n_estimators=100)
        reject_rf.fit(reject_X_train, reject_y_train)
        pickle.dump(reject_rf, open("reject_model.pkl", "wb"))
        text.insert(END, "Reject Model Trained & Saved!\n")
    except Exception as e:
        text.insert(END, f"Error: {str(e)}\n")

def explainAI():
    text.delete('1.0', END)
    text.insert(END, "Generating SHAP explanation...\n")
    try:
        if rf is None:
            text.insert(END, "Error: Train model first!\n")
            return

        explainer = shap.TreeExplainer(rf)
        # We use a small subset for speed in the demo
        shap_values = explainer.shap_values(loan_X_test[:50])

        # Handle different SHAP output formats for multi-class
        shap.summary_plot(shap_values, loan_X_test[:50])
        plt.show()
    except Exception as e:
        text.insert(END, f"Error: {str(e)}\n")

# UI Buttons
title = Label(main, text='Loan Risk Analysis', font=('Arial', 16, 'bold'))
title.pack(pady=10)

Button(main, text="1. Upload Dataset", width=20, command=loadDataset).pack(pady=2)
Button(main, text="2. Preprocess", width=20, command=processDataset).pack(pady=2)
Button(main, text="3. Split Data", width=20, command=splitDataset).pack(pady=2)
Button(main, text="4. Train Loan Model", width=20, command=aiApproval).pack(pady=2)
Button(main, text="5. Train Reject Model", width=20, command=aiReject).pack(pady=2)
Button(main, text="6. Explain AI (SHAP)", width=20, command=explainAI).pack(pady=2)

text = Text(main, height=15, width=110)
text.pack(pady=10)

main.mainloop()