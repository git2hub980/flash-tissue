import torch
from torchvision import transforms, models
from PIL import Image

# Load pretrained model (dummy example)
model = models.resnet50(pretrained=True)
model.eval()

# Dummy classes for pneumonia detection
classes = ["Normal", "Pneumonia"]

# Transform function
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

def predict_xray(file):
    img = Image.open(file).convert("RGB")
    img_t = transform(img).unsqueeze(0)  # batch dimension

    with torch.no_grad():
        outputs = model(img_t)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        conf, pred_idx = torch.max(probs, 1)
        prediction = classes[pred_idx]
        confidence = conf.item()
    return prediction, confidence
