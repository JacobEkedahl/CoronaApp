import requests

url = "https://us-central1-corona-live-updates.cloudfunctions.net/transformDatabase"

def main():
    countries = getCountries()
    for c in countries:
        x = requests.post(url, {"country": c})

def getCountries():
    # Opening file 
    file1 = open('countries.txt', 'r') 
    count = 0
    result = []
    
    for line in file1: 
        count += 1
        res = line.strip().partition(': "')[2][:-2]
        result.append(res)

    # Closing files 
    file1.close() 
    return result

if __name__ == "__main__":
    main()
